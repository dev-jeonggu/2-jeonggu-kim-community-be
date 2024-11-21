const path = require('path');
const { getJsonData, saveJsonData } = require('../utils/utils'); // NOTE : utils.js에서 formatDate 가져오기
const pool = require('../../config/db');
/*
// NOTE : 회원가입 처리 함수 -> DB 연결
// const dbPath = path.join(__dirname, '../config/db');
// const db = require(dbPath);
const addUser = async (email, password, nickname, profile_url) => {
    console.log(${email}, ${password}, ${nickname}, ${profile_url});
    const query = INSERT INTO test.users (email, password, nickname, profile_url) VALUES (?, ?, ?, ?);
    const [result] = await db.execute(query, [email, password, nickname, profile_url]);
    return result;
};
*/
const fs = require('fs').promises;
// const commentFilePath = path.join(__dirname, '../data/commentData.json');
// const boardFilePath = path.join(__dirname, '../data/boardData.json');
// const userFilePath = path.join(__dirname, '../data/userData.json');

/*
// NOTE : email, nickname에 따라 조회
// exports.getUser = async(key, value) =>{
//     const jsonData =  await getJsonData(userFilePath, "users");
//     const filteredUsers = jsonData.users.filter(user => user[key] === value);
//     if (filteredUsers.length > 0) {
//         // NOTE : 데이터가 존재할 경우 검증 실패 메시지 반환
//         return {
//             success: false,
//             message: "검증에 실패하였습니다.",
//             id: filteredUsers[0].id,
//             nickname: filteredUsers[0].nickname,
//             email: filteredUsers[0].email,
//             profile_url: filteredUsers[0].profile_url
//         };
//     } else {
//         // NOTE : 데이터가 없을 경우: 검증 성공 메시지 반환
//         return {
//             success: true,
//             message: "검증에 성공하였습니다."
//         };
//     }
// };
*/
exports.getUser = async(key, value) =>{
    try {
        // NOTE: MySQL 쿼리를 실행하여 조건에 맞는 사용자 데이터를 가져옴
        const [rows] = await pool.promise().query(
          `SELECT user_id, nickname, email, profile_url FROM innodb.users WHERE ?? = ?`,
          [key, value]
        );
    
        if (rows.length > 0) {
          // NOTE: 데이터가 존재할 경우 검증 실패 메시지 반환
          return {
            success: false,
            // message: "검증에 실패하였습니다.",
            user_id: rows[0].user_id,
            nickname: rows[0].nickname,
            email: rows[0].email,
            profile_url: rows[0].profile_url
          };
        } else {
          // NOTE: 데이터가 없을 경우 검증 성공 메시지 반환
          return {
            success: true
            // ,message: "검증에 성공하였습니다."
          };
        }
      } catch (err) {
        console.error('DB 쿼리 실행 중 오류 발생:', err);
        throw new Error('데이터베이스 요청 중 오류가 발생했습니다.');
      }
};

/*
// exports.addUser = async (email, password, nickname, profile_url) => {
//     let jsonData =  await getJsonData(userFilePath, "users"); 
//     // NOTE : 사용자 객체 생성
//     const newUser = {
//         id: jsonData.users.length + 1, // NOTE : 새로운 ID 설정
//         email,
//         password,
//         nickname,
//         profile_url
//     };

//     // NOTE : 새 사용자 추가
//     jsonData.users.push(newUser);

//     try {
//         // NOTE : 파일에 업데이트된 데이터 저장
//         await fs.writeFile(userFilePath, JSON.stringify(jsonData, null, 2));
//     } catch (error) {
//         console.error("Error writing file:", error);
//     }
//     return newUser;
// };
*/
exports.addUser = async (email, password, nickname, profile_url) => {
    try {
        // NOTE : MySQL INSERT 쿼리 실행
        const [result] = await pool.promise().query(
            `INSERT INTO innodb.users (email, password, nickname, profile_url) VALUES (?, ?, ?, ?)`,
            [email, password, nickname, profile_url]
        );

        // NOTE : 추가된 사용자의 ID 반환
        const newUser = {
            user_id: result.insertId,
            email,
            password,
            nickname,
            profile_url,
        };

        return newUser; 
    } catch (error) {
        console.error('Error inserting user into database:', error);

        // NOTE : UNIQUE 제약 조건 위반 에러 처리
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error('이미 사용 중인 이메일 또는 닉네임입니다.');
        }

        throw new Error('데이터베이스에 사용자 추가 중 오류가 발생했습니다.');
    }
};
/*
exports.updateUser = async (user_id, updateData) => {
    const jsonData =  await getJsonData(userFilePath, "users");

    const userIndex = jsonData.users.findIndex(user => user.id === user_id);
    if (userIndex === -1) throw new Error('User not found');
    jsonData.users[userIndex] = { ...jsonData.users[userIndex], ...updateData };
    await fs.writeFile(userFilePath, JSON.stringify(jsonData, null, 2));
    return jsonData.users[userIndex];
}
*/
exports.updateUser = async (user_id, updateData) => {
  try {
      // NOTE: 업데이트 데이터에서 필드 추출
      const { email, password, nickname, profile_url } = updateData;

      // NOTE: 업데이트 쿼리 실행
      const [result] = await pool.promise().query(
          `UPDATE innodb.users
           SET email = COALESCE(?, email),
               password = COALESCE(?, password),
               nickname = COALESCE(?, nickname),
               profile_url = COALESCE(?, profile_url)
           WHERE user_id = ?`,
          [email, password, nickname, profile_url, user_id]
      );

      // NOTE: 업데이트 결과 확인
      if (result.affectedRows === 0) {
          throw new Error('User not found'); // 존재하지 않는 사용자
      }

      return result;
  } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('데이터베이스에서 사용자 업데이트 중 오류가 발생했습니다.');
  }
};
// NOTE : 사용자 정보 삭제 및 관련 정보 삭제
// NOTE : 더미 데이터 사용
/*
exports.deleteUser = async (user_id, email) => {
  
    const jsonUserData = await getJsonData(userFilePath, 'users');
    jsonUserData.users = jsonUserData.users.filter(user => user.id !== user_id); 
    await saveJsonData(userFilePath, jsonUserData);
    
    const jsonBoardData = await getJsonData(boardFilePath, 'boards');
    jsonBoardData.boards = jsonBoardData.boards.filter(board => board.user_id !== user_id);
    await saveJsonData(boardFilePath, jsonBoardData);

    const jsonCommentData = await getJsonData(commentFilePath, 'comments');
    jsonCommentData.comments = jsonCommentData.comments.filter(comment => comment.user_id !== user_id); 
    await saveJsonData(commentFilePath, jsonCommentData);
    return true;
};*/
// NOTE : 트랜잭션 적용 전
/*
exports.deleteUser = async (user_id) => {
  try {
        // NOTE : MySQL INSERT 쿼리 실행
        const [user_result] = await pool.promise().query(
          `DELETE FROM innodb.users WHERE user_id = ?`,
          [user_id]);
        const [board_result] = await pool.promise().query(
          `DELETE FROM innodb.boards WHERE user_id = ?`,
          [user_id]);
        const [comment_result] = await pool.promise().query(
          `DELETE FROM innodb.comments WHERE user_id = ?`,
          [user_id]);

  } catch (error) {
      console.error('Error deleting user:', error);
      return false;

  }
  
  return true;
};
*/
// NOTE : 트랜잭션 적용 후
exports.deleteUser = async (user_id) => {
  const connection = await pool.promise().getConnection();
  try {
        // NOTE : (추가) : 트랜잭션 적용하기
        await connection.beginTransaction();
        const [user_result] = await pool.promise().query(
          `DELETE FROM innodb.users WHERE user_id = ?`,
          [user_id]
        );
        // console.log('Query executed successfully:', user_result);

        // NOTE : 게시글 삭제
        const [board_result] = await connection.query(
          `DELETE FROM innodb.boards WHERE user_id = ?`,
          [user_id]
        );
        // console.log('Query executed successfully:', board_result);
  
        // NOTE : 댓글 삭제
        const [comment_result] = await connection.query(
          `DELETE FROM innodb.comments WHERE user_id = ?`,
          [user_id]
        );
        // console.log('Query executed successfully:', comment_result);

        // NOTE : 의도적으로 에러 발생
        // throw new Error('Intentional error for rollback test');

        await connection.commit();

        return true;
  } catch (error) {
    await connection.rollback();
      console.error('Error deleting user:', error);
      return false;

  } finally {
    // NOTE : 연결 반환
    connection.release();
  }
};