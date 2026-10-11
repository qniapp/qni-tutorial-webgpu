"""Analytic finite Fourier sums/eigenvector formulae; not a circuit simulator."""
import cmath,json,math,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
qpe=json.loads((root/'tests/fixtures/quantum_phase_estimation_circuit-fixed.json').read_text())
original=json.loads((root/'tests/fixtures/quantum_phase_estimation_circuit-original.json').read_text())
kick=json.loads((root/'tests/fixtures/phase_kickback-fixed.json').read_text())
c,s=math.cos(math.pi/8),math.sin(math.pi/8)
assert abs((-s+c)/math.sqrt(2)-s)<1e-15 and abs((-s-c)/math.sqrt(2)+c)<1e-15
# Confirm the modified transform is literally the negative transform of the unchanged 4-bit example.
def transform(circuit):
 cols=circuit['cols']; start=next(i for i,col in enumerate(cols) if 'Swap' in col)
 result=[]
 for col in cols[start:]:
  if col==['}'] or col==[']']:break
  result.append(col)
 return result
assert transform(qpe['circuits'][2])==transform(qpe['circuits'][3])==transform(qpe['circuits'][5])
assert qpe['circuits'][4:]==original['circuits'][4:]
assert len([d for d in qpe['diff'] if d['before'].startswith('P(')])==12
for d in qpe['diff']:
 if d['before'].startswith('P('):assert d['after']==d['before'].replace('P(','P(-')
def ramp(N,phi):return [cmath.exp(2j*math.pi*phi*j)/math.sqrt(N) for j in range(N)]
def fourier(N,phi):return [sum(cmath.exp(2j*math.pi*(phi-k/N)*j) for j in range(N))/N for k in range(N)]
def serial(v):return [[z.real,z.imag] for z in v]
H=fourier(16,0.5)
assert abs(H[8]-1)<1e-14 and max(abs(z) for k,z in enumerate(H) if k!=8)<1e-14
assert abs(sum(abs(z)**2 for z in H)-1)<1e-14
phi3,phi4=fourier(8,1/3),fourier(16,1/3)
checks=[]
for N,k,v,p in [(8,3,phi3,68.8),(16,5,phi4,68.5),(16,6,phi4,17.2)]:
 percent=100*abs(v[k])**2;assert round(percent,1)==p
 checks.append({'bits':int(math.log2(N)),'k':k,'percent':percent,'roundedPercent':round(percent,1),'degrees':360*k/N,'errorDegrees':360*k/N-120})
sumpercent=100*(abs(phi4[5])**2+abs(phi4[6])**2);assert round(sumpercent,1)==85.7
# Reference expectations for test-only GPU readback, all measured circuits use pre-measurement selection.
qpeExpected=[ [s,-c],[-s*z for z in ramp(16,0.5)]+[c*z for z in ramp(16,0.5)], [0.25]*16,[-s*z for z in H]+[c*z for z in H],[0]*8+phi3,[0]*16+phi4]
kickExpected=[[0]*16+ramp(16,1/8),[-s*z for z in ramp(16,0.5)]+[c*z for z in ramp(16,0.5)]]
for circuit in kick['circuits']:
 counts=[sum(len(col)>q and col[q]=='•' for col in circuit['cols']) for q in range(4)];assert counts==[1,2,4,8]
for j,a in enumerate(kick['amplitudes'][:16]):
 literal=re.sub(r'\s+','',a['amplitude']).replace('i','j')
 assert abs(complex(literal)-ramp(16,1/8)[j])<5e-6
assert kick['amplitudes'][16:]==[{'amplitude':'0','ket':'0','size':'base'},{'amplitude':'1','ket':'1','size':'base'}]
result={'GPUExecuted':False,'method':'finite Fourier sums and eigenvector/product formulae, no circuit simulator','HModifiedControlOutput':{'k':8,'probability':abs(H[8])**2,'allOtherProbabilitiesMax':max(abs(z)**2 for k,z in enumerate(H) if k!=8),'targetAmplitudes':[-s,c]},'unchanged120DegreeExamples':checks,'fourBitBestOrEqualPercent':sumpercent,'resolutionDegrees':{'threeBits':360/8,'fourBits':360/16},'eigenstatePercent':[100*s*s,100*c*c],'kickbackPhaseIncrementDegrees':45,'kickbackEachControlProbability':1/16,'roundedDiagonalAmplitude':round(1/(4*math.sqrt(2)),5),'qpeExpected':list(map(serial,qpeExpected)),'kickbackExpected':list(map(serial,kickExpected))}
(root/'tests/fixtures/qpe-approved-analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if not k.endswith('Expected')},ensure_ascii=False,indent=2))
