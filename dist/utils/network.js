import os from "node:os";
export function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const deviceName in interfaces) {
        const networkInterfaces = interfaces[deviceName] ?? [];
        for (const networkInterface of networkInterfaces) {
            const { family, internal, address } = networkInterface;
            if (family === "IPv4" && !internal) {
                return address;
            }
        }
    }
    return "localhost";
}
//# sourceMappingURL=network.js.map