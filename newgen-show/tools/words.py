import json,sys
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
out={}
for i in range(1,9):
    segs,_=m.transcribe(f'vo{i}.mp3',language='vi',word_timestamps=True)
    out[str(i)]=[[round(w.start,2),round(w.end,2),w.word.strip()] for s in segs for w in s.words]
    print(i,' '.join(f"{w[2]}@{w[0]}" for w in out[str(i)]),flush=True)
json.dump(out,open('words.json','w'),ensure_ascii=False)
