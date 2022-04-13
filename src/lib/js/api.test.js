import  Api  from "./api.js"
let fakeBot = "bot_test"
let api = new Api(fakeBot)
let defaultFakeData = {
    bot: fakeBot,
    display: "S0ER3N",
    id: "38240208",
    lat: "52.51872933449911",
    lng: "13.390362543197966",
    name: "s0er3n",
    pic: "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyNjQ3OTkyMDA0LCJzdWIiOiJkMmIwMzIzNC03YWIzLTQwZWItOWM5Zi1lYjFlMjgwNDE1MjMiLCJlbWFpbCI6InNvZXJlbi5taWNoYWVsc0BnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6InR3aXRjaCIsInByb3ZpZGVycyI6WyJ0d2l0Y2giLCJnb29nbGUiXX0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vc3RhdGljLWNkbi5qdHZudy5uZXQvdXNlci1kZWZhdWx0LXBpY3R1cmVzLXV2L2NkZDUxN2ZlLWRlZjQtMTFlOS05NDhlLTc4NGY0MzgyMmU4MC1wcm9maWxlX2ltYWdlLTMwMHgzMDAucG5nIiwiY3VzdG9tX2NsYWltcyI6eyJicm9hZGNhc3Rlcl90eXBlIjoiIiwiZGVzY3JpcHRpb24iOiIiLCJvZmZsaW5lX2ltYWdlX3VybCI6IiIsInR5cGUiOiIiLCJ2aWV3X2NvdW50IjoxM30sImVtYWlsIjoic29lcmVuLm1pY2hhZWxzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJzMGVyM24iLCJpc3MiOiJodHRwczovL2FwaS50d2l0Y2gudHYiLCJuYW1lIjoiczBlcjNuIiwibmlja25hbWUiOiJTMEVSM04iLCJwaWN0dXJlIjoiaHR0cHM6Ly9zdGF0aWMtY2RuLmp0dm53Lm5ldC91c2VyLWRlZmF1bHQtcGljdHVyZXMtdXYvY2RkNTE3ZmUtZGVmNC0xMWU5LTk0OGUtNzg0ZjQzODIyZTgwLXByb2ZpbGVfaW1hZ2UtMzAweDMwMC5wbmciLCJwcm92aWRlcl9pZCI6IjM4MjQwMjA4Iiwic2x1ZyI6IlMwRVIzTiIsInN1YiI6IjM4MjQwMjA4In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.H-6s-yGMI8ClCzaAPejzOS0omO87MfyCI3b7Ffb6kaA"
}// token expires 2053
let fakeData 
let createFakeData = () => {
     fakeData =  JSON.parse(JSON.stringify(defaultFakeData))
     fakeData.lat = fakeData.lat + Math.random() + 0.1
     fakeData.lng = fakeData.lng + Math.random() + 0.1
}
describe("testing api",  () =>{
    beforeEach(() => {
        createFakeData();
    });
    describe("sending guess",  ()=> {
        it("should not return an error", async() => {
            let [error, res]  = await api.sendGuess(fakeData)
            expect(error).toBeUndefined()
        })
    })
    describe(`check if client is connected with bot: ${fakeBot}`,  () => {
        it(`should not error`, async() => {
            let [error, res]  = await api.checkIfClientIsConnected(fakeBot)
            expect(error).toBeUndefined()
        })
    })
    describe(`checking if guess is registered `,() => {
        let guessid 
        it(`sending guess to get id with fake data`, async() => {
            let [error, res]  = await api.sendGuess(fakeData)
            expect(error).toBeUndefined()
            guessid =  await res.text()
        })
        it("checking if guess registered", async () => {
            // maybe we need to wait before checking 

            let [error, res]  = await api.checkIfGuessIsRegistered(guessid)
            expect(error).toBeUndefined()
        })
    })
})