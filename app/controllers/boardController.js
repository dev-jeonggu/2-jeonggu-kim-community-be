const boardModel = require('../models/boardModel');
const path = require('path');
const fs = require('fs');

// NOTE : 게시글 전체 조회
exports.getBoardList = async (req, res) => {
    const userId = req.user?.id || null;
    const startPage = parseInt(req.query.startPage, 10) || 1;
    const endPage = parseInt(req.query.endPage, 10) || 10;

    if (startPage <= 0 || endPage < startPage) {
        return res.status(400).json({ message: "invalid", data: null });
    }

    try {
        const boardList = await boardModel.getBoardList(userId, startPage, endPage);
        res.status(200).json({ message: "success", data: boardList });
    } catch (error) {
        console.error('Error fetching board list:', error);
        res.status(500).json({ message: "server error", data: null });
    }
};

// NOTE : 게시글 추가
exports.addBoard = async (req, res) => {
    const email = req.user?.email || null;
    const userId = req.user?.id || null;
    
    const { title, content, image_nm, image_url } = req.body;

    if (!title || !content || !email) {
        return res.status(400).json({ message: '필수 필드가 누락되었습니다.' });
    }

    try {
        const newPost = await boardModel.addBoard({ title, content, email, image_nm, image_url, userId });
        res.status(201).json({ message: 'success', data: newPost });
    } catch (error) {
        console.error('Error adding board post:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.', data: null });
    }
};

// NOTE : 특정 게시글 조회
exports.getBoardInfo = async (req, res) => {
    const board_id = parseInt(req.params.board_id, 10);
    const email = req.user?.email || null;
    const userId = req.user?.id || null;
    if (!board_id) {
        return res.status(400).json({ message: "invalid", data: null });
    }
    
    try {
        const board = await boardModel.getBoardById(board_id, email, userId);
        if (board) {
            res.status(200).json({ message: 'success', data: board });
        } else {
            res.status(404).json({ message: 'not found', data: null });
        }
    } catch (error) {
        console.error('Error fetching board info:', error);
        res.status(500).json({ message: 'server error', data: null });
    }
};

// NOTE : 게시글 수정
exports.editBoard = async (req, res) => {
    const board_id = parseInt(req.params.board_id, 10);
    const { title, content, image_url, image_nm } = req.body;

    try {
        const editBoard = await boardModel.editBoard(board_id, { title, content, image_url, image_nm });
        res.status(200).json({ message: 'success', data: editBoard });
    } catch (error) {
        console.error('Error updating board post:', error);
        res.status(500).json({ message: 'server error', data: null });
    }
};

// NOTE : 게시글 삭제
exports.deleteBoard = async (req, res) => {
    const board_id = parseInt(req.params.board_id, 10);

    try {
        const success = await boardModel.deleteBoard(board_id);
        if (success) {
            res.status(200).json({ message: 'success' });
        } else {
            res.status(404).json({ message: 'Board not found' });
        }
    } catch (error) {
        console.error('Error deleting board:', error);
        res.status(500).json({ message: 'server error' });
    }
};

// NOTE : 좋아요 기능
exports.likeBoard = async (req, res) => {
    const { board_id } = req.body;
    const userId = req.user?.id || null;

    if (!board_id || !userId) {
        return res.status(400).json({ message: 'invalid', data: null });
    }

    try {
        const updatedBoard = await boardModel.likeBoard(board_id, userId);
        if (updatedBoard) {
            res.status(200).json({ message: 'success', data: updatedBoard });
        } else {
            res.status(404).json({ message: 'Board not found', data: null });
        }
    } catch (error) {
        console.error('Error liking board:', error);
        res.status(500).json({ message: 'server error', data: null });
    }
};

// NOTE : 조회수 증가
exports.addViewCount = async (req, res) => {
    const board_id = parseInt(req.params.board_id);
    const userId = req.user?.id || null;

    if (!board_id) {
        return res.status(400).json({ message: 'invalid', data: null });
    }
    try {
        const updatedPost = await boardModel.addViewCount(board_id, userId);
        if (updatedPost) {
            res.status(200).json({ message: 'success', data: updatedPost });
        } else {
            res.status(404).json({ message: 'Board post not found' });
        }
    } catch (error) {
        console.error('Error incrementing view count:', error);
        res.status(500).json({ message: 'server error' });
    }
};

// NOTE : 파일 업로드 처리 함수
exports.uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    const filePath = `../images/board/${req.file.filename}`;
    res.json({ message: '파일 업로드 성공', filePath });
};

exports.loadImage = (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'images', 'board', filename);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); 
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5555'); // NOTE : 클라이언트 도메인
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('파일 전송 중 오류 발생:', err);
                res.status(500).json({ message: '파일 전송 중 오류 발생' });
            }
        });
    });
};