# steem-autobot

> 스팀 자동 보팅 시스템
> 스팀 커뮤니티 : [hive-137029](https://steemit.com/trending/hive-137029)
> 개발자 : [@wonsama](https://steemit.com/@wonsama)

## 들어가기 앞서

> nodejs, pm2, nvm 이 설치 되었다는 가정하에 진행 하도록 하겠습니다.

* [pm2 설치](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)
* [nvm 설치](https://github.com/nvm-sh/nvm) 를 하신 후 아래를 진행 바랍니다.
* npm - v16.14.0, pm2 - 5.2.0 를 사용하였습니다. (22.03.04 기준)

( 물론 그냥 소스만 참조하셔서 필요한 부분만 copy & paste 하셔도 좋습니다 )

## 설치

> 설치 시 `3 vulnerabilities (2 low, 1 high)` 아마 이렇게 뜰 텐데 ... ( `steem` 라이브러리 업데이트가 안되다 보니 ) 우선 동작하는데에는 문제가 없으므로 그냥 사용하셔도 큰 이슈는 발생하지 않을 것이라 생각 됩니다.

```sh
git clone https://github.com/steem-autobot
cd steem-autobot
npm install
```

## 환경 설정

### ecosystem.config.js 설정

`ecosystem.config.js` 파일을 `ecosystem.config.sample` 파일을 참조하여 생성 (같은 위치) 바랍니다.

ecosystem.config.js 파일은 `process.env.xxx` 등과 같이, 소스 내 환경 변수에 쉽게 접근하기 위한 다양한 값을 지정할 수 있습니다.

### impl 폴더 내 파일 만들기

* impl 폴더 내 `sample.js` 를 참조하셔서 나만의 파일을 작성하실 수 있습니다.
* 파일 작성 후 `ecosystem.config.js` 파일 내 `MONITORS` 속성에 `impl, operations` 값을 지정하시면 됩니다.

## 실행

> `[id]` 값은 `pm2 list` 커맨드 수행후 나온 `id` 값을 넣어주면 됨

실행 - 대상 폴더 내에서 `pm2 start` 를 수행하면 됩니다.

### PM2 기타 명령

정지 - `pm2 stop [id]`
목록확인 - `pm2 list`
재실행 - `pm2 restart [id]`
삭제 - `pm2 delete [id]`
로그확인 - `pm2 logs`
모니터링 - `pm2 monit`

## 향후 계획

> `for the steem ???` 여튼 스팀 흥하길 ...

사실 `typescript` 로 새롭게 작성 하려 했지만, 뭐 시간 관계상 후딱 기존 소스를 정리하여 `js` 로 만들어 버렸네요 ㅜㅜ. 언젠가 여유가 된다면 새롭게 하나 더 만들어 보도록 할 예정 입니다.

## 참조링크

* [steem-js](https://github.com/steemit/steem-js/tree/master/doc)
* [pm2-doc-single-page](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)
* [application-declaration](https://pm2.keymetrics.io/docs/usage/application-declaration/)