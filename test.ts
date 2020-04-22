import fs from "fs";
import path from "path";
import aapt from "aaptjs2";
import unzipper from "unzipper";

/// app 包解压位置
const unzipDir = path.join(__dirname, './unzip')

/// APP包存放位置
const packagePath = path.join(__dirname, './package')

interface IPackageInfo {
  key?: string
  name?: string
  path?: string
}
class Manifest {
  private ios: IPackageInfo = {}
  private android: IPackageInfo = {}
  constructor() {
    this.start()
  }
  
  start() {
    this.findPackage()
  }

  runAndroid() {
    const { path } = this.android
    if (path) {
      this.unzip(path, unzipDir)
    }
  }

  /// 清空文件夹
  deleteDir(dirPath: string) {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const curPath = path.join(dirPath, file);
          if (fs.statSync(curPath).isDirectory()) {
            this.deleteDir(curPath);
            fs.rmdirSync(curPath)
          } else {
            fs.unlinkSync(curPath);
          }
        });
      } else {
        fs.mkdirSync(dirPath)
      }
    } catch (error) {
      console.log(error)
      return new Error('文件夹准备失败')
    }
  }

  // 查找安装包
  findPackage(filePath: string = packagePath) {
    const files = fs.readdirSync(filePath)
    for (const file of files) {
      if (/\.apk$/.test(file)) {
        const name = file.split('.')[0]
        this.android.name = name
        this.android.key = name.slice(0, name.lastIndexOf('_'))
        this.android.path = path.join(packagePath, file)
      } else if (/\.ipa$/.test(file)) {
        const name = file.split('.')[0]
        this.ios.name = name
        this.ios.key = name.slice(0, name.lastIndexOf('_'))
        this.ios.path = path.join(packagePath, file)
      }
    }
    return {
      ios: this.ios,
      android: this.android
    }
  }

  /// 解压安装包
  async unzip(appPath: string, outPath: string) {
    try {
      this.deleteDir(outPath) // 清空目录
      await fs.createReadStream(appPath).pipe(unzipper.Extract({ path: outPath }));
      console.clear();
    } catch (error) {
      console.error("111", error);
    }
  }

  /// 添加文件到安卓apk
  async addFileInAndroid(apkFilePath: string, filePath: string | string[]) {
    try {
      await aapt.add(apkFilePath, filePath);
      console.log("android：文件添加成功");
      // const res = await aapt.add('./android.apk', './assets/apps/__UNI__AB43AD3/www/test11.zip')
      // console.log('res', res)
    } catch (error) {
      console.error("android：文件添加失败 ", error);
      // console.error(error)
    }
  }
}

new Manifest();
