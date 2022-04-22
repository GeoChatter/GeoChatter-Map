
// import fetch from 'node-fetch' // uncomment when using testing
// Failure state of the guessing process

// Check if target client is online
const SERVER_GET = 'https://api.geochatter.tv/guess?botname=';

// Send guess and read guess ID
const SERVER_POST = 'https://api.geochatter.tv/guess/'; //'https://guess.geochatter.tv/api/' //

// Check guess status : 200 = processed , 100 = being processed , default = failed
const SERVER_GUESS_CHECK = 'https://api.geochatter.tv/guess?id=';

export default class Api {
  _bot
  streamer
  constructor(bot) {
    this.bot = bot;
    // this.isButtonEnabled = true
  }


  set bot(bot) {
    this._bot = bot
    if (this.bot) {
      this.checkIfClientIsConnected()
    }

  }
  get bot() {
    return this._bot
  }

  async checkIfClientIsConnected() {
    let error;
    let res;
    try {
      res = await fetch(SERVER_GET + this.bot,
        {
          referrer: "https://geochatter.tv/",
          mode: "cors"
        });
      if (!res.ok) {
        console.log(res)
        error = [res.status, res.statusText];
      }
    } catch (e) {
      error = e;
    }
    //disabled
    // const resObj = await res.json()
    // const streamer = resObj?.channelName
    // if (streamer) {
    //   this.streamer = resObj?.channelName
    // }
    // console.log(this.streamer)

    return [error, res];
  }

  async sendGuess(data) {
    let error;
    let res;
    try {
      res = await fetch(
        SERVER_POST, // Endpoint will change probably
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
          },
          referrer: "https://geochatter.tv/",
          mode: "cors"
        }
      );
      if (!res.ok) {
        console.log(res)
        error = [res.status, res.statusText];
      }
    } catch (e) {
      error = e;
    }

    return [error, res];
  }

  async checkIfGuessIsRegistered(id) {
    let error;
    let res;
    try {
      res = await fetch(SERVER_GUESS_CHECK + id,
        {
          referrer: "https://geochatter.tv/",
          // mode: "no-cors"
          mode: "cors"
        });
      if (!res.ok) {
        console.log(res)
        error = [res.status, res.statusText];
      }
    } catch (e) {
      error = e;
    }

    return [error, res];
  }
}
