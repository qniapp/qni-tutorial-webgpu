"""Closed-form Fourier/period checks for the unported qpe_output page."""
import argparse,cmath,hashlib,json,math,re
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('--output',type=Path);parser.add_argument('--approved',action='store_true');args=parser.parse_args()
source=args.source.read_text();N=16;phi=1/8
assert len(re.findall(r'逆\s*QFT',source))==(0 if args.approved else 5)
if args.approved:assert '周波数 2 が得られます。 周波数が 2 ということは' in source
circles=[complex(re.sub(r'\s+','',x).replace('i','j')) for x in re.findall(r"{{\s*'([^']+)'\s*\|\s*qubit_circle",source)]
assert len(circles)==16
for j,z in enumerate(circles):assert abs(z-cmath.exp(2j*math.pi*phi*j)/4)<5e-6
results=[]
for sign in [-1,1]:
 b=[sum(cmath.exp(2j*math.pi*(phi+sign*k/N)*j) for j in range(N))/N for k in range(N)]
 peak=max(range(N),key=lambda k:abs(b[k])**2);assert peak==(2 if sign==-1 else 14)
 assert abs(abs(b[peak])**2-1)<1e-14
 results.append({'sign':sign,'peak':peak,'probability':abs(b[peak])**2,'inferredDegrees':360*peak/N})
result={'GPUExecuted':False,'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'fourierResults':results,'periodSamples':1/phi,'frequencyOver16Samples':N*phi,'full16IntervalsDegrees':360*N*phi,'phaseDegrees':360*phi,'HOutput8Degrees':360*8/16,'inverseFourierNameOccurrences':0 if args.approved else 5,'circles':[[z.real,z.imag] for z in circles],'decision':'approved A/B only applied' if args.approved else 'STOP: 5 inverse-QFT names and period2 require separate approval'}
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
