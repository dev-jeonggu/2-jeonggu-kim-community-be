const authModel = require('../models/authModel');
const { generateToken } = require('../utils/jwt');

const jwt = require("jsonwebtoken");

// NOTE: 로그인
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) { // NOTE : email 또는 password가 없으면 에러 반환
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const result = await authModel.login(email, password);

        if (result.success) {
            // NOTE : JWT 생성
            const token = generateToken({
                user_id: result.user_id,
                nickname: result.nickname,
                email: result.email,
                profile_url: result.profile_url
            });
            
            // NOTE : 클라이언트로 토큰과 사용자 데이터를 반환
            return res.status(200).json({
                message: 'success',
                data: {
                    success: result.success
                ,   user_id: result.user_id
                ,   email: result.email
                ,   nickname: result.nickname
                ,   profile_url: result.profile_url
                ,   token: token // NOTE : 토큰 추가
                }
            });
        } else {
            //  NOTE : 로그인 실패
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};