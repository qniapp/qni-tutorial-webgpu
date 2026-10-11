"""Pure modular arithmetic evidence for the axmodN image label, not a simulator."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
image=root.parent/'qni/apps/tutorial/images/axmodN.png'
a,x,N=2,3,15
# The controls x0=1,x1=1 select multipliers a^(2^0),a^(2^1).
bits=[(x>>i)&1 for i in range(4)]
expected=pow(a,x,N)
selected=1
for i,bit in enumerate(bits):
 if bit:selected=selected*pow(a,2**i,N)%N
assert selected==expected==8
wrong=pow(x,a,N)
assert wrong==9 and wrong!=expected
source=(root/'docs/shor-u-original-source.html').read_text()
import re
cells=[(float(v),int(k))for v,k in re.findall(r"{{\s*'([^']+)'\s*\|\s*qubit_circle:\s*(\d+),\s*'base'\s*}}",source,re.S)]
assert len(cells)==768
assert cells[512+16*x+expected]==(.25,56)
assert cells[512+16*x+wrong]==(0.0,57)
result={'GPUExecuted':False,'quantumCPUSimulatorExecuted':False,'image':'axmodN.png','imageSHA256':hashlib.sha256(image.read_bytes()).hexdigest(),'observedImageLabel':'x^a mod N','proposedOwnedDiagramLabel':'a^x mod N','a':a,'x':x,'N':N,'controlBitsLowToHigh':bits,'selectedMultipliersResult':selected,'correctPowAModN':expected,'imagePowXModN':wrong,'authoredFinalTable':{'ket56Amplitude':.25,'ket57Amplitude':0},'decision':'STOP before shor_u route; U1-U4 approval does not approve this additional image-formula correction'}
print(json.dumps(result,ensure_ascii=False,indent=2))
