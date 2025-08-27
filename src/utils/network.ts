import os from 'node:os'; // 引入 Node 的 os 模块用于读取网卡信息

export function getLocalIPAddress(): string { // 导出获取本机对外 IPv4 地址的函数
  const interfaces = os.networkInterfaces(); // 读取所有网卡接口信息
  for (const dev in interfaces) { // 遍历每一个网卡设备名
    const faces = interfaces[dev] ?? []; // 取得该设备的地址列表，若未定义则回退为空数组
    for (let i = 0; i < faces.length; i++) { // 遍历该设备的各个地址
      const iface = faces[i]!; // 取出当前地址信息对象
      if (iface.family === 'IPv4' && iface.internal === false) { // 匹配外部可用 IPv4 地址
        return iface.address as unknown as string; // 返回第一个匹配到的 IPv4 地址字符串
      }
    }
  }
  return 'localhost'; // 若未找到合适地址则回退为 localhost
}



