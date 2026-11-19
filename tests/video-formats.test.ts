import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mediaFormat,mediaSignature} from '../src/media-format';
const bytes=(s:string)=>new TextEncoder().encode(s);
test('video containers accepted with matching signatures, never arbitrary files',()=>{
 const samples:Record<string,Uint8Array>={
  'video/mp4':new Uint8Array([0,0,0,12,...bytes('ftypisom')]),
  'video/x-m4v':new Uint8Array([0,0,0,12,...bytes('ftypM4V ')]),
  'video/quicktime':new Uint8Array([0,0,0,12,...bytes('ftypqt  ')]),
  'video/webm':new Uint8Array([26,69,223,163,...bytes('webm')]),
  'video/x-msvideo':bytes('RIFF0000AVI '),
  'video/ogg':bytes('OggS0000theora')
 };
 for(const [type,data] of Object.entries(samples)){
  assert.equal(mediaFormat(type,'video')?.kind,'video');
  assert.equal(mediaFormat(type,'image'),null);
  assert.equal(mediaSignature(data,type),true,type);
  assert.equal(mediaSignature(bytes('<html>not a video</html>'),type),false,type);
 }
 assert.equal(mediaSignature(new Uint8Array([0,0,0,8,...bytes('mdat')]),'video/quicktime'),true);
 assert.equal(mediaSignature(new Uint8Array([0,0,0,99,...bytes('mdat')]),'video/quicktime'),false);
 assert.equal(mediaSignature(bytes('OggS0000vorbis'),'video/ogg'),false);
 assert.equal(mediaSignature(samples['video/mp4'],'application/unknown'),false);
});
