"""Classical bit rotation and authored table checks; no quantum CPU simulator/GPU."""
import argparse,hashlib,json,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('--output',type=Path);p.add_argument('--approved',action='store_true');args=p.parse_args();source=args.source.read_text()
circuits=[json.loads(s) for s in re.findall(r"data-json='([^']*)'",source)];assert len(circuits)==1
cells=[{'amplitude':float(a),'ket':int(k)} for a,k in re.findall(r"{{\s*'([^']+)'\s*\|\s*qubit_circle:\s*(\d+),\s*'base'\s*}}",source,re.S)];assert len(cells)==768
stages=[cells[i*256:(i+1)*256] for i in range(3)]
values=[[1]*16,[2 if x&1 else 1 for x in range(16)],[pow(2,x,15) for x in range(16)]]
labelDiff=[]
for g,stage in enumerate(stages):
 for index,cell in enumerate(stage):
  x,f=divmod(index,16);assert cell['amplitude']==(.25 if f==values[g][x] else 0)
  if cell['ket']!=index:labelDiff.append({'grid':g,'position':index,'before':cell['ket'],'after':index,'amplitude':cell['amplitude']})
 assert sum(c['amplitude']**2 for c in stage)==1
if args.approved:
 assert labelDiff==[] and '(1996)' in source
 assert 'の値は列番号 (横方向) から読みます。' in source
 assert r'注: 図中の出力ラベル \(x^a\, mod\, N\) は、正しくは \(a^x\, mod\, N\) です。' in source
else:assert len(labelDiff)==3 and all(x['position']==242 and x['before']==241 for x in labelDiff)
def rotate(y,n):return ((y<<n)|(y>>(4-n)))&15
for y in range(15):assert rotate(y,1)==2*y%15
assert rotate(8,1)==1 and 16%15==1
for x in range(16):
 y=1
 if x&1:y=rotate(y,1)
 if x&2:y=rotate(y,2)
 assert y==pow(2,x,15)
result={'GPUExecuted':False,'sourceSHA256':hashlib.sha256(source.encode()).hexdigest(),'circuits':circuits,'JSONDiff':[],'palette':[[]],'maxWireCount':[1],'runButtonCount':source.count('{% include run_circuit_button.html %}'),'imageCount':source.count('<img '),'circleCount':len(cells),'stageValues':values,'labelDiff':labelDiff,'probabilityEachXPercent':.25**2*100,'wraparound':{'1000':8,'leftRotate4':1,'16mod15':1},'method':'Authored numeric table amplitudes compared with pure arithmetic and classical four-bit rotation. No state-vector execution/readback.','questions':['U summary omits current-value multiplication','Arxiv linked preprint is1995 not2021','Three duplicated ket241 should be242','f columns run horizontally and x rows vertically, prose reverses directions'],'decision':'STOP before shor_u route; proposed fixes need approval'}
if args.approved:
 result['questions']=[];result['decision']='APPROVED U1/U2=1996/U3/U4 plus exact PR589 note; original PNG/credit preserved'
 result['shorUStageExpected']=[{'stage':stage,'column':col,'values':[[.25 if f==vals[x] else 0,0]for x in range(16)for f in range(16)]}for stage,col,vals in zip(['initial','shift1','shift2'],[6,12,17],values)]
 result['shorUExpected']=[result['shorUStageExpected'][-1]['values']]
text=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.write_text(text)
else:print(text)
