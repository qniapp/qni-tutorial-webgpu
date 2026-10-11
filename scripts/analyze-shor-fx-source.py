"""Shor modular arithmetic and abstract gate domain checks. No quantum simulator/GPU."""
import argparse,hashlib,json,math,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);args=p.parse_args();source=args.source.read_text()
circuits=[json.loads(s) for s in re.findall(r"data-json='([^']*)'",source)]
assert len(circuits)==2
assert circuits[0]['cols'][1]==['|0>']*4 and circuits[0]['cols'][2]==['H']*4
assert circuits[1]['cols'][6]==[1,1,1,1,'|1>','|0>','|0>','|0>']
N=15;a=2;bits=4;values=[pow(a,x,N) for x in range(2**bits)]
assert values==[1,2,4,8]*4 and math.gcd(a,N)==1
naive=[a*y%N for y in range(2**bits)]
assert naive[0]==naive[15]==0 and len(set(naive))==15
extended=[a*y%N if y<N else y for y in range(2**bits)]
assert sorted(extended)==list(range(2**bits))
controls=[2**j for j in range(bits)]
for x in range(2**bits):
 chosen=[j for j in range(bits) if (x>>j)&1]
 assert sum(controls[j] for j in chosen)==x
 value=1
 for j in chosen:value=value*pow(a,controls[j],N)%N
 assert value==values[x]
assert a%N==2 and pow(a,0,N)==1 and (a*8)%N==1
result={'GPUExecuted':False,'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'circuits':circuits,'JSONDiff':[],'palette':[[],[]],'maxWireCount':[1,1],'runButtonCount':source.count('{% include run_circuit_button.html %}'),'images':re.findall(r'<img src="([^"]+)"',source),'xBits':bits,'xRange':[0,15],'f0':1,'values':values,'controlledUApplicationCounts':controls,'naiveAll16Multiplication':naive,'naiveDistinctOutputs':len(set(naive)),'proposedUnitaryExtensionPermutation':extended,'summaryCounterexample':{'a':a,'N':N,'currentValue':8,'definitionResult':a*8%N,'constantAModN':a%N},'analyticPreparation':{'first':'H^tensor4 |0^4> has amplitude 1/4 at x=0..15','second':'same x preparation times target |1>, indices16..31 have amplitude1/4 (LSB-first wires)','norm':1,'note':'Product formula only, not circuit CPU simulation or GPU readback'},'decision':'STOP: summary contradicts U multiplication; full-register unitary extension/domain needs author decision. No route or product edits.'}
assert result['runButtonCount']==2 and len(result['images'])==4
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
