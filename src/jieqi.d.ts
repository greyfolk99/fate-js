declare module "./jieqi.json" {
  interface JieqiData {
    sec: number[]
    month: number[]
    year: number[]
  }
  const data: JieqiData
  export default data
}
