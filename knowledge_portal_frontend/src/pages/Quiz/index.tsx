import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  LinearProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { quizService } from '../../services/quiz.service';
import type { Quiz as QuizType, Question } from '../../services/quiz.service';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Answer {
  questionId: string;
  answer: string | string[];
}

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const {
    data: quiz,
    loading: quizLoading,
    error: quizError,
    execute: fetchQuiz,
  } = useApi<QuizType>(quizService.getQuizById);

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id, fetchQuiz]);

  useEffect(() => {
    if (quiz) {
      setTimeLeft(quiz.time_limit);
    }
  }, [quiz]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && quiz) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.questionId === questionId);
      if (existing !== -1) {
        const newAnswers = [...prev];
        newAnswers[existing] = { questionId, answer };
        return newAnswers;
      }
      return [...prev, { questionId, answer }];
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;

    setIsSubmitting(true);
    try {
      const result = await quizService.submitQuiz({
        quiz_id: quiz.id,
        user_id: String(user.id),
        answers: answers.map(a => Number(a.answer))
      });
      setQuizResult(result);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
    setIsSubmitting(false);
  };

  if (quizLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading quiz...</Typography>
      </Box>
    );
  }

  if (quizError || !quiz) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">Failed to load quiz</Typography>
      </Box>
    );
  }

  const currentQuestion: Question = quiz.questions[currentQuestionIndex];

  if (quizResult) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Quiz Results
          </Typography>
          <Box sx={{ my: 4 }}>
            <Typography variant="h6" gutterBottom>
              Score: {quizResult.score}%
            </Typography>
            <Typography variant="body1" gutterBottom>
              Correct Answers: {quizResult.correctAnswers} / {quizResult.totalQuestions}
            </Typography>
          </Box>
          <Stack spacing={2}>
            {quizResult.feedback.map((feedback: any) => (
              <Alert key={feedback.questionId} severity={feedback.isCorrect ? 'success' : 'error'}>
                {feedback.explanation}
              </Alert>
            ))}
          </Stack>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Back to Video
            </Button>
            <Button variant="contained" onClick={() => navigate(`/learning-path`)}>
              Continue Learning
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {quiz.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Chip
              label={`Question ${currentQuestionIndex + 1}/${quiz.questions.length}`}
              color="primary"
            />
            <Chip
              label={`Time Left: ${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
                .toString()
                .padStart(2, '0')}`}
              color={timeLeft < 60 ? 'error' : 'default'}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={(currentQuestionIndex / quiz.questions.length) * 100}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.text}
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={answers.find((a) => a.questionId === currentQuestion.id)?.answer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options?.map((option) => (
                <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
          >
            Previous
          </Button>
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button variant="contained" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Quiz;
