"""Closed-form analytic checks only; no circuit simulator or production fallback."""
import cmath, hashlib, json, math, re
from pathlib import Path
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--output',type=Path)
args=parser.parse_args()
source=args.source.read_text()
circuits=[json.loads(x) for x in re.findall(r"data-json='([^']+)'",source)]
assert len(circuits)==5
# Geometric-series formula for a phase ramp, sign - is phase→frequency.
def probability(N,phi,k,sign=-1):
 d=phi+sign*k/N
 if abs(d-round(d))<1e-12:return 1.0
 return math.sin(math.pi*N*d)**2/(N*N*math.sin(math.pi*d)**2)
checks=[]
for N,k,percent in [(8,3,68.8),(16,5,68.5),(16,6,17.2)]:
 p=probability(N,1/3,k)
 assert round(100*p,1)==percent
 checks.append({'N':N,'phaseTurns':1/3,'k':k,'probability':p,'percent':100*p,'rounded':round(100*p,1),'degrees':360*k/N,'errorDegrees':360*k/N-120})
assert probability(16,0.5,8)==1
assert round(100*(checks[1]['probability']+checks[2]['probability']),1)==85.7
angles=[]
controls=[]
for c in circuits:
 angles.append([t for col in c['cols'] for t in col if isinstance(t,str) and re.fullmatch(r'P\(-?π_[248]\)',t)])
 controls.append([sum(col[q]=='•' for col in c['cols'] if len(col)>q) for q in range(max(map(len,c['cols'])))])
assert angles[1]==angles[2] and len(angles[1])==6 and all('-' not in t for t in angles[1])
assert len(angles[3])==3 and len(angles[4])==6 and all('-' in t for t in angles[3]+angles[4])
assert controls[0][:4]==[1,2,4,8] and controls[2][:4]==[1,3,6,11]
assert controls[3][:3]==[1,3,6] # Includes negative Fourier block controls (0/1/2).
assert controls[4][:4]==[1,3,6,11]
c,s=math.cos(math.pi/8),math.sin(math.pi/8)
assert abs((-s+c)/math.sqrt(2)-s)<1e-15 and abs((-s-c)/math.sqrt(2)+c)<1e-15
result={'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'sourceCircuits':circuits,'fourierAngles':angles,'controlCountsIncludingFourier':controls,'checks':checks,'HPhasePiOutput':{'k':8,'probability':1,'resolutionDegrees':360/16},'sumFourBitBestOrEqualPercent':100*(checks[1]['probability']+checks[2]['probability']),'positiveTransformPeaks':[{'N':N,'k':(-k)%N,'percent':100*probability(N,1/3,(-k)%N,1)} for N,k in [(8,3),(16,5),(16,6)]],'eigenphases':{'c':c,'s':s,'probability0Percent':100*c*c,'probability1Percent':100*s*s},'GPUExecuted':False,'decision':'STOP: positive inverse-QFT H blocks vs negative QFT 120-degree examples; owner approval required'}
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
