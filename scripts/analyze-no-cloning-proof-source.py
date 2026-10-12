"""Tensor-product/adjoint identities only: no gate execution or quantum simulator."""
import argparse,hashlib,json,math,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);a=p.parse_args();s=a.source.read_text()
kron=lambda x,y:[a*b for a in x for b in y]
conj=lambda x:[complex(a).conjugate()for a in x]
dot=lambda x,y:sum(a*b for a,b in zip(x,y))
apple=[0,1];zero=[1,0];baby=[1/math.sqrt(2)]*2
inputApple=kron(apple,zero);inputBaby=kron(baby,zero)
trueBra=conj(inputApple);sourceBra=kron(conj(zero),conj(apple))
assert trueBra==[0,0,1,0] and sourceBra==[0,1,0,0]
assert dot(sourceBra,inputApple)==0 and dot(trueBra,inputApple)==1
assert dot(sourceBra,inputBaby)==0
correct=dot(trueBra,inputBaby).real;assert abs(correct-1/math.sqrt(2))<1e-12
assert abs(correct-dot(conj(apple),baby))<1e-12
edits=[
 [r'(\langle 0|\langle 🍎|)U^{\dagger}_{CLONE}',r'(\langle 🍎|\langle 0|)U^{\dagger}_{CLONE}'],
 [r'(\langle 0|\langle🍎|)U^{\dagger}_{CLONE}U_{CLONE}',r'(\langle🍎|\langle 0|)U^{\dagger}_{CLONE}U_{CLONE}'],
 [r'\Rightarrow &\langle 0|\langle🍎|👶\rangle|0\rangle =',r'\Rightarrow &(\langle🍎|\langle 0|)(|👶\rangle|0\rangle) =']
]
for before,after in edits:assert s.count(before)==1
result={'sourceSHA256':hashlib.sha256(s.encode()).hexdigest(),'GPUExecuted':False,'CPUQuantumSimulatorExecuted':False,'method':'Scalar tensor product and complex conjugate only; no unitary/gate execution','convention':'|a>|b> = |a> tensor |b>; adjoint preserves tensor-factor order','apple':[0,1],'baby':baby,'zero':[1,0],'inputApple':inputApple,'trueBra':[z.real for z in trueBra],'sourceReversedBra':[z.real for z in sourceBra],'sourceBraOnAppleZero':0,'correctBraOnAppleZero':1,'sourceBraOnBabyZero':0,'correctBraOnBabyZero':correct,'appleBabyInnerProduct':correct,'edits':edits,'decision':'STOP before porting appendix: ask for three exact bra-order/grouping changes','circuitCount':0,'images':0,'creditCount':0}
t=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if a.output:a.output.write_text(t)
else:print(t)
