const fs = require('fs')
const path = require('path')
const JSZIP = require("jszip")
const utility = require("utility")
const rootPath = path.resolve('./dist')

const fileInfo = []
const versionName = 'version.json'
const config = {
  noZip: false,
  update: false,
  version: undefined,
  zipName: undefined
}

~(() => {
  const argv = process.argv.splice(2).join(':').split('-').filter(item => !!item)
  for (const item of argv) {
    let [key, value] = item.split(':')
    key = key.toLocaleLowerCase()
    switch (key) {
      case 'v': // version 设置热更新版本
      case 'version':
        config.version = `V${value}`
        break
      case 'u': // update 自动更新，根据根目录的 version.json 版本加一个小版本升级
      case 'update':
        config.update = true
        break
      case 'n': // name 压缩包 包名
      case 'name':
        config.zipName = value
        break
      case 'nz': // noZip 是否不压缩
      case 'noZip':
        config.noZip = true
        break
    }
  }

  const { update, version, zipName } = config
  if (!update && !version && !zipName) return // 普通编译不做压缩处理

  //调用文件遍历方法
  fileDisplay(rootPath, () => {
    try {
      const psthUrl = path.join(rootPath, 'chcp.manifest')
      fs.writeFileSync(psthUrl, JSON.stringify(fileInfo))
      setVersion()
      startZIP()
    } catch (error) {
      console.error(error)
    }
  })

})()

function setVersion() {
  let { version } = config
  if (!version) {
    try {
      const res = fs.readFileSync(path.join(__dirname, versionName))
      version = (JSON.parse(res.toString())).webVersion.split('.')
      version[version.length - 1]++
      version = version.join('.')
      config.version = version
    } catch (error) {
      throw Error('找不到 version.json 文件')
    }
  }
  const versionJson = JSON.stringify({ webVersion: version })
  fs.writeFileSync(path.join(rootPath, versionName), versionJson)
  fs.writeFileSync(path.join(__dirname, versionName), versionJson)
}

async function fileDisplay(filePath, callBack) {
  //根据文件路径读取文件，返回文件列表 readdirSync
  try {
    const files = fs.readdirSync(filePath)
    for (const filename of files) {
      const filedir = path.join(filePath, filename);
      //根据文件路径获取文件信息，返回一个fs.Stats对象
      const stats = fs.statSync(filedir)
      const isFile = stats.isFile();//是文件
      if (isFile) {
        // 读取文件内容
        const content = fs.readFileSync(filedir);
        const hash = utility.md5(content)
        let file = path.join(`${filePath.substring(rootPath.length, filePath.length)}`, filename)
        file = file.replace(/\\/g, '/')
        file = file.replace(/^\//, '')
        fileInfo.push({ file, hash })
      } else {
        fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
      }
    }
    callBack && callBack()

  } catch (error) {
    console.error(error);
  }
}

// 读取目录及文件
function readDir(_zip, nowPath) {
  const files = fs.readdirSync(nowPath) // 读取目录中的所有文件及文件夹（同步操作）
  for (const fileName of files) {
    const fillPath = path.join(nowPath, fileName)
    const file = fs.statSync(fillPath) // 获取一个文件的属性
    if (file.isDirectory()) { // 如果是目录的话，继续查询
      const dirlist = _zip.folder(fileName) // 压缩对象中生成该目录
      readDir(dirlist, fillPath) // 重新检索目录文件
    } else {
      _zip.file(fileName, fs.readFileSync(fillPath)) // 压缩目录添加文件
    }
  }
}

// 压缩文件
async function startZIP() {
  const zip = new JSZIP()

  let { version, zipName, noZip } = config
  if (noZip) return // 不压缩
  readDir(zip, rootPath)
  const content = await zip.generateAsync({// 设置压缩格式，开始打包
    type: "nodebuffer",// nodejs用
    compression: "DEFLATE",// 压缩算法
    compressionOptions: { level: 9 } // 压缩级别
  })
  zipName = `${zipName || version || 'dist'}.zip`
  fs.writeFileSync(path.join(rootPath, zipName), content, 'utf-8')
}
