import os

import huggingface_hub
import huggingface_hub.file_download as hf_file_download
import torch
import whisperx
from whisperx.diarize import DiarizationPipeline


def _patch_hf_hub_download(module):
    """pyannote 3.x의 use_auth_token → huggingface_hub 1.x의 token 호환."""
    original = module.hf_hub_download

    def wrapper(*args, use_auth_token=None, token=None, **kwargs):
        if token is None and use_auth_token is not None:
            token = use_auth_token
        kwargs.pop("use_auth_token", None)
        return original(*args, token=token, **kwargs)

    module.hf_hub_download = wrapper


_patch_hf_hub_download(huggingface_hub)
_patch_hf_hub_download(hf_file_download)

_original_torch_load = torch.load


def _patched_torch_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)


torch.load = _patched_torch_load

HF_TOKEN = os.environ.get("HF_TOKEN", "").strip()
AUDIO_DIR = "test_file/audio"
OUTPUT_DIR = "test_file/transcript/simplified"
MODEL_NAME = "large-v2"

# GPU가 있으면 GPU(cuda), 없으면 CPU 자동 선택
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE_TYPE = "float16" if DEVICE == "cuda" else "int8"

def process_audio(audio_path: str, stt_model, diarize_model) -> str:
    """오디오 파일 하나를 처리하여 화자가 분리된 텍스트를 반환합니다."""
    
    # 1. 오디오 로드 및 기본 전사 (STT)
    audio = whisperx.load_audio(audio_path)
    result = stt_model.transcribe(audio, batch_size=16)
    language = result.get("language", "en")
    
    # 2. 타임스탬프 초정밀 정렬 (Alignment)
    align_model, align_meta = whisperx.load_align_model(language_code=language, device=DEVICE)
    result = whisperx.align(result["segments"], align_model, align_meta, audio, DEVICE, return_char_alignments=False)
    
    # 3. 화자 분리 진행 (Diarization)
    # 화자가 2명인 대화라면 min=2, max=2로 고정하면 정확도가 더 올라갑니다.
    diarize_segments = diarize_model(audio, min_speakers=1, max_speakers=2)
    
    # 4. 단어와 화자 병합
    result = whisperx.assign_word_speakers(diarize_segments, result)
    
    # 5. 보기 좋게 텍스트 묶기 (같은 사람이 이어서 말하면 합침)
    final_lines = []
    current_speaker = None
    current_text = []

    for segment in result["segments"]:
        speaker = segment.get("speaker", "UNKNOWN")
        text = segment.get("text", "").strip()

        if speaker != current_speaker:
            if current_text:
                final_lines.append(f"[{current_speaker}] {' '.join(current_text)}")
                current_text = []
            current_speaker = speaker
        
        current_text.append(text)
        
    # 마지막 문장 털어내기
    if current_text:
        final_lines.append(f"[{current_speaker}] {' '.join(current_text)}")

    return "\n\n".join(final_lines)

def main():
    if not HF_TOKEN:
        raise ValueError(
            "HF_TOKEN 환경변수가 필요합니다. "
            "model/.env.example을 참고해 HF_TOKEN을 설정하세요."
        )

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"🚀 AI 모델 로드 중... (Device: {DEVICE})")
    stt_model = whisperx.load_model(MODEL_NAME, DEVICE, compute_type=COMPUTE_TYPE)
    diarize_model = DiarizationPipeline(use_auth_token=HF_TOKEN, device=DEVICE)

    audio_files = [f for f in os.listdir(AUDIO_DIR) if f.endswith(('.ogg', '.wav', '.mp3'))]
    
    if not audio_files:
        print(f"오디오 파일이 없습니다: {AUDIO_DIR}")
        return

    for audio_file in audio_files:
        print(f"\n▶ 처리 중: {audio_file}")
        audio_path = os.path.join(AUDIO_DIR, audio_file)
        
        # 코어 로직 실행
        final_transcript = process_audio(audio_path, stt_model, diarize_model)
        
        # 결과 저장
        out_path = os.path.join(OUTPUT_DIR, f"{audio_file.split('.')[0]}.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(final_transcript)
        
        print(f"✔ 완료: {out_path}")

if __name__ == "__main__":
    main()