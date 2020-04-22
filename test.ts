// const fs = require("fs");   //或者 fs
// const unzip = require("unzip-stream");
// const aapt = require('aaptjs2');

import fs from 'fs'
import aapt from 'aaptjs2'
import unzipper from 'unzipper'

class Manifest {
  constructor() {
    this.unzip()
  }

  async unzip() {
    try {
      aapt.aapt(['d', './android.apk', './dist'])
      // await fs.createReadStream('android.apk').pipe(unzipper.Extract({ path: './dist' }))
    } catch (error) {
      console.error('111', error);
    }
  }

  async addFileInAndroid(apkFilePath: string, filePath: string | string[]) {
    try {
      await aapt.add(apkFilePath, filePath)
      console.log('android：文件添加成功')
      // const res = await aapt.add('./android.apk', './assets/apps/__UNI__AB43AD3/www/test11.zip')
      // console.log('res', res)
    } catch (error) {
      console.error('android：文件添加失败 ', error)
      // console.error(error)
    }
  }
}

new Manifest()

// try {
//   fs.createReadStream('android.apk').pipe(unzip.Extract({ path: './dist' }))
//   // fs.createReadStream('ios.ipa').pipe(unzip.Extract({ path: './dist' }))
// } catch (error) {
//   console.error('error', error)
// }