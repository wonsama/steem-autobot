////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : kr-dev-tag-vote.js

  설명 : 
    * white-list 에 등록된 사람이 kr-dev 태그 포함 포스팅 시 보팅을 수행함.
    * 원본 글의 복사본을 @kr-dev.curator01 ... kr-dev.curator05 개의 계정이 순환 해가면서 글을 COPY ( 원본 보존, 복제 글 링크로 관리 )
    * 해당 글을 kr-dev community 에 작성하도록 함. ( hive-137029 )

  최초작성일 : 2022.03.00
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const fs = require("fs");
const moment = require("moment");
const { ROOT_PATH } = require("../src/util/wconst");
const { sleep, now } = require("../src/util/wetc");
const { lpad } = require("../src/util/wstring");
const wsteem = require(`${ROOT_PATH}/src/util/wsteem`); // vote 라는 변수를 사용하는 관계로 prefix를 붙여 사용하는 방법을 수행

////////////////////////////////////////////////////////////
//
// const (상수정의)
//

// 아래 값은 custom.config.js 에서 읽어 들이며, 반드시 설정 해야 됨.
const COMMUNITY_ID = process.env.COMMUNITY_ID;
const COMMUNITY_TAG = process.env.COMMUNITY_TAG;
const VOTER_ID = process.env.VOTER_ID;
const CURATOR_ID_PREFIX = process.env.CURATOR_ID_PREFIX; // kr-dev.cu
const CURATOR_POSTING_KEYS = JSON.parse(process.env.CURATOR_POSTING_KEYS);
const VOTER_POSTING_KEY = process.env.VOTER_POSTING_KEY;
const WHITE_LIST = JSON.parse(process.env.WHITE_LIST);

// 필수 아님
const VOTE_GAP_SEC = process.env.VOTE_GAP_SEC || 1000 * 60 * 5;
const VOTE_WEIGHT = process.env.VOTE_WEIGHT || 1e4;
const CURATOR_MAX_CNT = process.env.CURATOR_MAX_CNT || 5;

////////////////////////////////////////////////////////////
//
// let (변수정의)
//
let votes = []; // 보팅 해야 될 목록
let ccount = 0; // 0~4, curation count @kr-dev.cu0 ~ kr-dev.cu4 (5개 활동)

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

/**
 * 원본 글에서 5라인 정도 추출하여 미리보기를 만들어 주도록 한다
 * @param {String} c 원본 글
 * @param {number} line 읽어 들일 라인 수
 * @returns string
 */
function _getSmartBody(c, line = 5) {
  let sp = c.body.split("\n");
  let count = 0;
  let header = [];
  header.push(
    `#### 원본 글 보러가기 : [${c.title}](/${c.category}/@${c.author}/${c.permlink})`
  );
  header.push("");
  header.push(`<sub>작성자 : @${c.author} 미리보기 (5 sentences)</sub>`);
  header.push("");
  header.push("---");
  header.push("");
  let body = sp.reduce((prev, curr) => {
    if (count < line) {
      if (curr.replace(/\s/gi) != "") {
        count++;
      }
      prev.push(curr);
    }
    return prev;
  }, []);
  let tail = [];
  tail.push("");
  tail.push("---");
  tail.push("");
  tail.push(
    `[더 보기](/${c.category}/@${c.author}/${c.permlink}) 에서 확인 하실 수 있습니다.`
  );
  tail.push("");
  tail.push("---");
  tail.push("");
  tail.push(
    `[광고] 개발자 커뮤니티에 참여하세요 - 개발자 커뮤니티에 참여 하면 다양한 혜택을 받을 수 있습니다. [참여방법](/hive-137029/@kr-dev/x3v6n)`
  );
  return [...header, ...body, ...tail];
}

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
  // operations = operations.filter(
  //   (x) => x.operation_data.parent_permlink == COMMUNITY_ID // comment 와 getContent 의 속성값의 차이가 있음에 유의
  // );

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
  operations = operations.filter((x) => {
    let metadata;
    try {
      metadata = JSON.parse(x.operation_data.json_metadata);
    } catch (err) {
      // parse exception : json_metadata is empty ...
      return false;
    }

    // FIX : 가끔가다 tag 없이 전송하는 경우도 있음 ;;
    if (metadata.tags && metadata.tags.includes(COMMUNITY_TAG)) {
      // COMMUNITY_TAG : kr-dev 를 포함한 경우
      return true;
    }
    return false;
  });

  return operations;
};

/**
 * 스크래핑한 글 정보를 커뮤니티에 포스팅 한다
 * @param {Object} c Posting Content Info
 */
async function _writeScrapPost(c) {
  // 원본 글의 요약 정보 포스팅
  let cwif = CURATOR_POSTING_KEYS[ccount];
  let cauthor = `${CURATOR_ID_PREFIX}${ccount}`;

  // comment is recalled : 1 RPCError: Assert Exception:permlink.size()
  console.log(cauthor, c.permlink);
  await wsteem.comment(
    cwif,
    "",
    COMMUNITY_ID,
    cauthor,
    c.permlink,
    `[by @${c.author}] ${c.title}`,
    _getSmartBody(c).join("\n"),
    c.json_metadata
  );
  // 큐레이터 카운트 증가
  ccount++;
  ccount = ccount % CURATOR_MAX_CNT;
  fs.writeFileSync(
    `${ROOT_PATH}/saved/ccount.json`,
    JSON.stringify({ ccount }, null, 2)
  );
  console.log("_writeScrapPost", cauthor, ccount);
  await sleep();
}

/**
 * 광고용 글쓰기를 수행한다
 * @param {Object} c Posting Content Info
 */
async function _writeAdReply(c) {
  let cwif = CURATOR_POSTING_KEYS[ccount];
  let cauthor = `${CURATOR_ID_PREFIX}${ccount}`;
  let adscript = [];
  adscript.push(
    `[광고] [STEEM 개발자 커뮤니티에 참여](/hive-137029/@kr-dev/x3v6n) 하시면, 다양한 혜택을 받을 수 있습니다.`
  );

  await wsteem.comment(
    cwif,
    c.author,
    c.permlink,
    cauthor,
    `adreply-${new Date().getTime()}`,
    "",
    adscript.join("\n"),
    c.json_metadata
  );
  // 큐레이터 카운트 증가
  ccount++;
  ccount = ccount % CURATOR_MAX_CNT;
  fs.writeFileSync(
    `${ROOT_PATH}/saved/ccount.json`,
    JSON.stringify({ ccount }, null, 2)
  );
  console.log("_writeAdReply", cauthor, ccount);
  await sleep();
}

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
        title: `[@${c.author}] ${c.title}`,
        created: c.created,
        url: `https://steemit.com/${c.category}/@${c.author}/${c.permlink}`,
      });

      // 커뮤니티에 글을 작성하지 않은 경우
      // 원본 글의 요약 정보 포스팅 수행
      //! 별도 함수로 async 를 보낸 경우에는 반드시 내 외부에 await 을 추가하여 사용한다.
      //! 그렇지 않음 변수 사용 시 ( duplication or not update ) 등이 발생할 수 있다.
      if (COMMUNITY_ID != c.category) {
        await _writeScrapPost(c);
      }
      // 광고용 댓글 쓰기를 수행한다
      await _writeAdReply(c);
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
      let votedPath = `${ROOT_PATH}/logs/voted-${now("YYYYMMDD")}.json`;
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
        works: now(),
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
  console.log("init votes", votes);
  ccount = fs.existsSync(`${ROOT_PATH}/saved/ccount.json`)
    ? require(`${ROOT_PATH}/saved/ccount.json`).ccount
    : 0;
  console.log("init ccount", ccount);
})();

module.exports = {
  notify,
};
