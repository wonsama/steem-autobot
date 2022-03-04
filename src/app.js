////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : app.js

  설명 : application 진입점, ecosystem.config.js 에서 변경 가능

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const Entrypoint = require("@pm2/io").Entrypoint;

////////////////////////////////////////////////////////////
//
// const (상수정의)
//

////////////////////////////////////////////////////////////
//
// let (변수정의)
//

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

new (class App extends Entrypoint {
  // start - sensors - actuators - stop
  // This is the very first method called on startup
  async onStart(cb) {
    // Returning the callback will tell PM2 that the app is ready to process queries
    // [Function (anonymous)]
    require(`./monitor/wloader`).start();
    return cb();
  }

  // This is the very last method called on exit || uncaught exception
  onStop(err, cb, code, signal) {
    // stop undefined [Function (anonymous)] 0 null
    // console.log("stop", err, cb, code, signal);
  }

  // Here we declare some process metrics
  sensors() {
    // console.log("sensors");
  }

  // Here are some actions to interact with the app in live
  actuators() {
    // console.log("actuators", process.env.NODE_ENV);
  }
})();

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

// module.exports = {};
