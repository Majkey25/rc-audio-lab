import { test, expect } from '@playwright/test'
import { audioCoefficients, digitalResponse } from '../../src/physics'

test('production AudioWorklet matches analytic DSP at three frequencies and bypass', async ({ page }) => {
  await page.goto('./')
  const circuit={resistance:100000,capacitance:10e-9}, rate=48000
  const b0=audioCoefficients(circuit,rate).b0
  for(const frequency of [41.2,159.15494309189535,5000]) {
    const actual=await page.evaluate(async({b0,frequency,rate})=>{
      const ctx=new OfflineAudioContext(1,rate,rate)
      await ctx.audioWorklet.addModule(new URL('rc-processor.js',location.href).href)
      const node=new AudioWorkletNode(ctx,'rc-highpass',{outputChannelCount:[1]})
      node.parameters.get('b0')!.value=b0
      const buffer=ctx.createBuffer(1,rate,rate),input=buffer.getChannelData(0)
      for(let n=0;n<rate;n++)input[n]=Math.sin(2*Math.PI*frequency*n/rate)*.5
      const source=ctx.createBufferSource();source.buffer=buffer;source.connect(node).connect(ctx.destination);source.start()
      const output=(await ctx.startRendering()).getChannelData(0)
      let ss=0,cc=0,sc=0,ys=0,yc=0
      for(let n=Math.floor(rate*.25);n<rate;n++){
        const s=Math.sin(2*Math.PI*frequency*n/rate),c=Math.cos(2*Math.PI*frequency*n/rate)
        ss+=s*s;cc+=c*c;sc+=s*c;ys+=output[n]*s;yc+=output[n]*c
      }
      const det=ss*cc-sc*sc,a=(ys*cc-yc*sc)/det,b=(yc*ss-ys*sc)/det
      return {magnitude:Math.hypot(a,b)/.5,phase:Math.atan2(b,a)}
    },{b0,frequency,rate})
    const expected=digitalResponse(circuit,frequency,rate)
    expect(actual.magnitude).toBeCloseTo(expected.magnitude,4)
    expect(actual.phase).toBeCloseTo(expected.phase!,4)
  }
  const bypass=await page.evaluate(async()=>{
    const ctx=new OfflineAudioContext(1,4800,48000)
    await ctx.audioWorklet.addModule(new URL('rc-processor.js',location.href).href)
    const filter=new AudioWorkletNode(ctx,'rc-highpass',{outputChannelCount:[1]})
    filter.parameters.get('mix')!.value=0
    const source=ctx.createConstantSource();source.offset.value=.2;source.connect(filter).connect(ctx.destination);source.start()
    const data=(await ctx.startRendering()).getChannelData(0)
    return Math.max(...data.map(value=>Math.abs(value-.2)))
  })
  expect(bypass).toBeLessThan(1e-7)
})

test('guitar sample is decoded and RC changes produce a substantial real signal difference', async ({ page }) => {
  await page.goto('./')
  const result=await page.evaluate(async()=>{
    const rate=48000,decode=new OfflineAudioContext(1,1,rate)
    const response=await fetch(new URL('audio/guitar-f2.flac',location.href))
    const recording=await decode.decodeAudioData(await response.arrayBuffer())
    const energies=[]
    for(const capacitance of [100e-9,2.2e-9]){
      const ctx=new OfflineAudioContext(1,rate*3,rate)
      await ctx.audioWorklet.addModule(new URL('rc-processor.js',location.href).href)
      const filter=new AudioWorkletNode(ctx,'rc-highpass',{outputChannelCount:[1]})
      const fc=1/(2*Math.PI*100000*capacitance)
      filter.parameters.get('b0')!.value=1/(1+Math.tan(Math.PI*fc/rate))
      const source=ctx.createBufferSource();source.buffer=recording;source.connect(filter).connect(ctx.destination);source.start()
      const output=(await ctx.startRendering()).getChannelData(0)
      let energy=0;for(const sample of output)energy+=sample*sample
      energies.push(energy)
    }
    return {duration:recording.duration,attenuationDb:10*Math.log10(energies[1]/energies[0])}
  })
  expect(result.duration).toBeGreaterThan(1)
  expect(result.attenuationDb).toBeLessThan(-6)
  console.log('Recorded guitar strong-cut vs full-range:',result)
})
