declare module 'jspack' {
    export class jspack {
        static Unpack(format: string, bytes: Buffer, offset: number): [number]
        static PackTo(format: string, data: Buffer): Buffer
        static Pack(format: string, data: Buffer | Array<number>): Buffer
        static CalcLength(format: string, data: Buffer): Buffer
    }
}