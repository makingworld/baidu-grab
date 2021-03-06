const http = require('http')
const ora = require('ora')
const log = require('../lib/log')
const zhidao = require('../lib/zhidao')

// 根据传来的百度结果链接解析为真实地址并返回  （√ 无bug）

module.exports = function (link, v) {
  return new Promise((resolve, reject) => {
    let req = http.get(link, (res) => {
      res.setTimeout(5000, () => {
        log.err(link)
        ora().fail(link)
        reject(`解析真实链接时出错（响应超时）。`)
      })
      res.setEncoding('utf8')
      let rawData = '';
      let real = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        if (res.headers['location']) {
          if (global.verbose) ora().succeed(res.headers['location'])
          real = res.headers['location']
        } else if (rawData.match(/http.*\)/)) {
          if (global.verbose) ora().succeed(rawData.match(/http.*\)/)[0].slice(0, -2))
          real = rawData.match(/http.*\)/)[0].slice(0, -2)
        } else {
          reject(`解析了${link}，但是未发现真实地址。`)
        }
        if (real.indexOf('zhidao.baidu.com') !== -1) {
          zhidao(real, v).then(ress => {
            resolve(ress)
          }).catch(e => {
            reject('解析百度知道真实地址时发生错误')
          })
        } else {
          resolve(real)
        }
      })
      res.on('error', (e) => {
        log.err(link)
        if (global.verbose) ora().fail(link)
        reject(`解析真实链接时出错（连接错误）`)
      })
    })
    req.on('error', e => {
      if (global.verbose) ora().fail(link)
      reject(`请求过于频繁，远程服务器拒绝了连接。`)
    })
    req.setTimeout(5000, () => {
      log.err(link)
      if (global.verbose) ora().fail(link)
      reject(`解析以真实链接时出错（请求超时）`)
    })
  })
}