import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
test('eigenphases approval is exactly two substitutions in original source',()=>{
 const source=readFileSync('docs/eigenphases-approved-source.html','utf8')
 expect(source).not.toContain('固有状態と呼ばれる状態ベクトル')
 const reversed=source.replace('呼ばれる状態ベクトル','呼ばれるユニークな状態ベクトル').replace('QPU 命令それぞれが固有状態を持っています。','QPU 命令それぞれが独自の (固有の)\n  状態ベクトルを持っています。')
 expect(createHash('sha256').update(reversed).digest('hex')).toBe('a2ac117ee7f2e88cdd40d97932c5696881f1ec1c0493a568558f9cfc6be53d7d')
})
