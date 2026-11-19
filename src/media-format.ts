export const MAX_BYTES=10*1024*1024, CHUNK=256*1024;
const types:Record<string,{kind:string;extension:string}>={
 'image/jpeg':{kind:'image',extension:'jpg'},'image/png':{kind:'image',extension:'png'},'image/webp':{kind:'image',extension:'webp'},
 'video/quicktime':{kind:'video',extension:'mov'},'video/x-m4v':{kind:'video',extension:'m4v'},
 'video/webm':{kind:'video',extension:'webm'},'video/x-msvideo':{kind:'video',extension:'avi'},'video/ogg':{kind:'video',extension:'ogv'},
 'video/mp4':{kind:'video',extension:'mp4'},'audio/mpeg':{kind:'audio',extension:'mp3'},'audio/mp4':{kind:'audio',extension:'m4a'},
 'audio/wav':{kind:'audio',extension:'wav'},'audio/x-wav':{kind:'audio',extension:'wav'},'audio/ogg':{kind:'audio',extension:'ogg'},
 'audio/aac':{kind:'audio',extension:'aac'},
 'application/pdf':{kind:'file',extension:'pdf'},'application/msword':{kind:'file',extension:'doc'},
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':{kind:'file',extension:'docx'}
};
export function mediaFormat(type:string,kind:string){const value=types[type];return value?.kind===kind?value:null;}
export function mediaSignature(bytes:Uint8Array,type:string){
 const text=(start:number,end:number)=>new TextDecoder().decode(bytes.subarray(start,end));
 if(type==='image/png')return [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==='image/webp')return text(0,4)==='RIFF'&&text(8,12)==='WEBP';
 if(type==='audio/wav'||type==='audio/x-wav')return text(0,4)==='RIFF'&&text(8,12)==='WAVE';
 if(type==='audio/ogg')return text(0,4)==='OggS';
 if(type==='audio/mpeg')return text(0,3)==='ID3'||bytes[0]===255&&(bytes[1]&224)===224;
 if(type==='audio/aac')return bytes[0]===255&&(bytes[1]&246)===240;
 if(type==='application/pdf')return text(0,5)==='%PDF-';
 if(type==='application/msword')return [208,207,17,224,161,177,26,225].every((v,i)=>bytes[i]===v);
 if(type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document')return text(0,2)==='PK'&&bytes[2]===3&&bytes[3]===4&&new TextDecoder().decode(bytes).includes('word/document.xml');
 if(type==='video/x-msvideo')return text(0,4)==='RIFF'&&text(8,12)==='AVI ';
 if(type==='video/ogg')return text(0,4)==='OggS'&&text(0,256).includes('theora');
 if(type==='video/webm')return [26,69,223,163].every((v,i)=>bytes[i]===v)&&text(0,256).includes('webm');
 if(type==='video/quicktime'){
  // QuickTime can start with a movie or media atom instead of ftyp.
  if(bytes.length<8)return false;
  const size=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0);
  return size>=8&&size<=bytes.length&&['ftyp','moov','mdat','wide','free'].includes(text(4,8));
 }
 if(['video/mp4','video/x-m4v','audio/mp4'].includes(type))return bytes.length>=12&&text(4,8)==='ftyp';
 return false;
}

