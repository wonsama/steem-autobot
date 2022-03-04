////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : sample.js

  설명 : impl 폴더 내 구현되는 예시

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const fs = require("fs");
const moment = require("moment");
const { ROOT_PATH } = require("../src/util/wconst");
const { sleep } = require("../src/util/wetc");
// const { getContent, vote } = require(`${ROOT_PATH}/src/monitor/wsteem`);
const wsteem = require(`${ROOT_PATH}/src/monitor/wsteem`); // vote 라는 변수를 사용하는 관계로 prefix를 붙여 사용하는 방법을 수행

////////////////////////////////////////////////////////////
//
// const (상수정의)
//

// 아래 값은 custom.config.js 에서 읽어 들이며, 반드시 설정 해야 됨.
const COMMUNITY_ID = process.env.COMMUNITY_ID;
const VOTER_ID = process.env.VOTER_ID;
const VOTER_POSTING_KEY = process.env.VOTER_POSTING_KEY;
const WHITE_LIST = JSON.parse(process.env.WHITE_LIST);

// 필수 아님
const VOTE_GAP_SEC = process.env.VOTE_GAP_SEC || 1000 * 60 * 5;
const VOTE_WEIGHT = process.env.VOTE_WEIGHT || 1e4;

////////////////////////////////////////////////////////////
//
// let (변수정의)
//
let votes = []; // 보팅 해야 될 목록

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//
/// 대상 목록 [res] 정보를 필터링 한다

/**
 * 읽어들인 정보를 추가 필터링 한다
 * @param {Object[]} operations
 * @returns
 */
const _filter_notify = (operations) => {
  // 글만 추출
  operations = operations.filter(
    (x) => x.operation_data.parent_author == "" && x.operation_data.title != ""
  );

  // 특정 커뮤니티 글만 추출
  operations = operations.filter(
    (x) => x.operation_data.parent_permlink == COMMUNITY_ID // comment 와 getContent 의 속성값의 차이가 있음에 유의
  );

  // 댓글만 추출
  // operations = operations.filter(
  //   (x) => x.operation_data.parent_author != "" && x.operation_data.title == ""
  // );

  // 글 또는 댓글 내 특정 단어 포함
  // operations = operations.filter(
  //   (x) => x.operation_data.body.indexOf('#helpme') >= 0
  // );

  // 제목 내 특정 단어 포함
  // operations = operations.filter(
  //   (x) => x.operation_data.title.indexOf('#helpme') >= 0
  // );

  // 특정 글쓴이가 쓴 글
  operations = operations.filter((x) =>
    WHITE_LIST.includes(x.operation_data.author)
  );

  // json_metadata 내 특정 값 점검
  // operations = operations.filter((x) => {
  //   let metadata = JSON.parse(x.operation_data.json_metadata);
  //   if (metadata.app == "steemit/0.2") {
  //     // 스팀잇 공홈에서 글 쓴 경우
  //     return true;
  //   }
  //   return false;
  // });

  return operations;
};

/**
 * 보팅 대상목록 메모리 적재
 * @param {Object[]} operations Operations 목록
 */
async function _writeVotes(operations) {
  let buffer = [];
  for (let o of operations) {
    // 컨텐츠 정보를 가져온다
    let c = await wsteem.getContent(
      o.operation_data.author,
      o.operation_data.permlink,
      VOTER_ID
    );
    // 수정글이 아니며, 보팅을 수행하지 않은 경우에만 동작
    if (!c.changed && !c.voted) {
      buffer.push({
        author: c.author,
        permlink: c.permlink,
        title: c.title,
        created: c.created,
        url: `https://steemit.com/${c.category}/@${c.author}/${c.permlink}`,
      });
    }
  }
  // 보딩 대상 정보 업데이트
  if (buffer.length > 0) {
    votes.push(...buffer);
    fs.writeFileSync(
      `${ROOT_PATH}/saved/votes.json`,
      JSON.stringify(votes, null, 2)
    );
  }
}

/**
 * 일정시간(VOTE_GAP_SEC) 후 보팅 대상목록 내 처음 항목 보팅 수행
 * @param {Object[]} votes 보팅 대상 목록
 */
async function _processVote(votes) {
  if (votes.length > 0) {
    let vote = votes[0];
    let gap = new Date().getTime() - new Date(`${vote.created}.000Z`).getTime();
    // 일정시간(VOTE_GAP_SEC) 후 보팅 대상목록 내 처음 항목 보팅 수행
    if (gap > VOTE_GAP_SEC) {
      // 컨텐츠 정보를 가져온다
      let c = await wsteem.getContent(vote.author, vote.permlink, VOTER_ID);
      let votedPath = `${ROOT_PATH}/logs/voted-${moment().format(
        "YYYYMMDD"
      )}.json`;
      let voted = fs.existsSync(votedPath) ? require(votedPath) : [];

      // 보팅을 수행하지 않은 경우에만 동작
      // (등록 후 N 분 내 글을 수정할 수도 있기 때문에 수정 조건은 제거)
      // 계정당 1일 1회만 보팅 가능
      if (
        !c.voted &&
        voted.filter((x) => x.author == vote.author).length == 0
      ) {
        // 보팅수행
        await wsteem.vote(
          VOTER_POSTING_KEY,
          VOTER_ID,
          vote.author,
          vote.permlink,
          VOTE_WEIGHT
        );
        console.log(`voted ::: ${vote.url} ${vote.title}`);
      }

      // 보팅대상 목록제거
      let removed = votes.shift();
      removed = {
        ...removed,
        voted: c.voted,
        works: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      fs.writeFileSync(
        `${ROOT_PATH}/saved/votes.json`,
        JSON.stringify(votes, null, 2)
      );

      // 보팅이력 기록
      voted.push(removed);
      fs.writeFileSync(votedPath, JSON.stringify(voted, null, 2));

      // 안정적인 작업을 위해 슬립처리
      await sleep();
    }
  }
}

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

/**
 * 콜백함수 - 매칭되는 operations 목록 정보를 넘겨 받는다.
 * @param {Object[]} operations operations 목록
 */
const notify = async (operations) => {
  // 대상 필터링
  operations = _filter_notify(operations);

  // 보팅 대상목록 메모리 적재
  await _writeVotes(operations);

  // 일정시간(VOTE_GAP_SEC) 후 보팅 대상목록 내 처음 항목 보팅 수행
  await _processVote(votes);
};

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

// 기타 초기화를 위한 즉시 실행함수, 최초 1회만 호출 됨, 비 동기임에 유의
(async function () {
  // 최초 보팅 목록을 가져와서 메모리에 적재한다
  // 매번 파일에서 읽기는 그러니 메모리에 적재하기 위함.
  votes = fs.existsSync(`${ROOT_PATH}/saved/votes.json`)
    ? require(`${ROOT_PATH}/saved/votes.json`)
    : [];
})();

module.exports = {
  notify,
};
