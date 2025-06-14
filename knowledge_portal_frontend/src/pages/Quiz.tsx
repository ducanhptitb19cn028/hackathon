import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { setCurrentQuiz, startQuiz, answerQuestion, completeQuiz } from '../store/slices/quizSlice';
import { quizService, Quiz as QuizType } from '../services/quiz.service';
import { AppDispatch } from '../store';

const Quiz: React.FC = () => {
  const { videoId, quizId } = useParams<{ videoId?: string; quizId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentQuiz, currentAttempt } = useSelector((state: RootState) => state.quiz);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizType[]>([]);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        if (quizId) {
          console.log('Loading existing quiz with ID:', quizId);
          // Load existing quiz by quiz ID
          const existingQuiz = await quizService.getQuizById(quizId);
          console.log('Loaded existing quiz:', {
            quiz_id: existingQuiz.id,
            title: existingQuiz.title,
            num_questions: existingQuiz.questions.length
          });
          dispatch(setCurrentQuiz(existingQuiz));
          dispatch(startQuiz());
          setTimeLeft(existingQuiz.time_limit || 600);
        } else if (videoId) {
          console.log('Generating quiz for video:', videoId);
          // Generate new quiz for video ID
          const videoQuiz = await quizService.generateQuiz({
            video_id: videoId,
            difficulty_level: 'medium',
            num_questions: 5,
          });
          console.log('Generated quiz:', {
            quiz_id: videoQuiz.id,
            title: videoQuiz.title,
            num_questions: videoQuiz.questions.length
          });
          dispatch(setCurrentQuiz(videoQuiz));
          dispatch(startQuiz());
          setTimeLeft(videoQuiz.time_limit || 600); // Default to 10 minutes if no time limit set
        } else {
          // Load available quizzes
          const quizList = await quizService.getAvailableQuizzes();
          console.log('Loaded available quizzes:', quizList.map(q => ({ id: q.id, title: q.title })));
          setAvailableQuizzes(quizList);
        }
      } catch (err) {
        console.error('Quiz loading error:', err);
        setError('Failed to load quiz content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [videoId, quizId, dispatch]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (timeLeft > 0 && currentQuiz && !showResults) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Clear the interval when we hit zero
            if (timer) clearInterval(timer);
            // Only auto-submit if we haven't already shown results
            if (!showResults) {
              handleSubmitQuiz();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup function
      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [timeLeft, currentQuiz, showResults]);

  const handleSubmitQuiz = async () => {
    if (!currentQuiz || !currentAttempt || !user || submitting || showResults) {
      console.error('Cannot submit quiz:', {
        hasQuiz: !!currentQuiz,
        hasAttempt: !!currentAttempt,
        hasUser: !!user,
        isSubmitting: submitting,
        showingResults: showResults
      });
      setError('Cannot submit quiz: Missing required data');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      // Validate that all questions have been answered
      const unansweredQuestions = currentQuiz.questions.filter(
        (q) => currentAttempt.answers[q.id] === undefined
      );

      if (unansweredQuestions.length > 0) {
        console.warn('Unanswered questions:', {
          total: currentQuiz.questions.length,
          unanswered: unansweredQuestions.length,
          unansweredIds: unansweredQuestions.map(q => q.id)
        });
        setError(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
        setSubmitting(false);
        return;
      }

      // Convert answers from object to array format, ensuring order matches questions
      const answersArray = currentQuiz.questions.map((question) => {
        const answer = currentAttempt.answers[question.id];
        if (answer === undefined) {
          throw new Error(`Missing answer for question ${question.id}`);
        }
        return answer;
      });

      console.log('Preparing quiz submission:', {
        quiz_id: currentQuiz.id,
        answers: answersArray,
        user_id: user.id.toString()
      });

      const result = await quizService.submitQuiz({
        quiz_id: currentQuiz.id,
        answers: answersArray,
        user_id: user.id.toString()
      });

      console.log('Quiz submission result:', {
        quiz_id: result.quiz_id,
        score: result.score,
        passed: result.passed,
        num_correct: result.correct_answers.filter(Boolean).length
      });

      setQuizResult(result);
      dispatch(completeQuiz({
        score: result.score,
        timeTaken: currentQuiz.time_limit - timeLeft,
        passed: result.passed,
        correct_answers: result.correct_answers,
        explanations: result.explanations
      }));
      setShowResults(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  const renderResults = () => {
    if (!quizResult || !currentQuiz) return null;

    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            Quiz Results
          </Typography>
          <Alert 
            severity={quizResult.passed ? "success" : "warning"}
            sx={{ mb: 3 }}
          >
            {quizResult.passed 
              ? "Congratulations! You passed the quiz!" 
              : "You didn't pass this time. Keep learning and try again!"}
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            Score: {quizResult.score}%
          </Typography>
          <Typography variant="body1" gutterBottom>
            Time taken: {Math.floor((currentQuiz.time_limit - timeLeft) / 60)}:{((currentQuiz.time_limit - timeLeft) % 60).toString().padStart(2, '0')}
          </Typography>

          <Box sx={{ mt: 4 }}>
            {currentQuiz.questions.map((question, index) => (
              <Card key={question.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Question {index + 1}: {question.text}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color={quizResult.correct_answers[index] ? "success.main" : "error.main"}
                  >
                    Your answer: {question.options[currentAttempt?.answers[question.id] ?? -1] || 'Not answered'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {quizResult.explanations[index]}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
              disabled={quizResult.passed}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      </Container>
    );
  };

  const renderQuiz = () => {
    if (!currentQuiz || !currentAttempt) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography>Loading quiz...</Typography>
        </Box>
      );
    }

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];

    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            {currentQuiz.title}
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">
              Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
            </Typography>
            <Typography variant="subtitle1" color={timeLeft < 60 ? "error" : "inherit"}>
              Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </Typography>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              {currentQuestion.text}
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={currentAttempt.answers[currentQuestion.id] ?? ''}
                onChange={(e) => dispatch(answerQuestion({ 
                  questionId: currentQuestion.id, 
                  answer: parseInt(e.target.value) 
                }))}
              >
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={index}
                    control={<Radio />}
                    label={option}
                  />
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
            {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitQuiz}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    );
  };

  const renderQuizList = () => {
    if (availableQuizzes.length === 0) {
      return (
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Typography variant="h6" align="center">
              No quizzes available at the moment.
            </Typography>
          </Box>
        </Container>
      );
    }

    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" gutterBottom>
            Available Quizzes
          </Typography>
          <Grid container spacing={3}>
            {availableQuizzes.map((quiz) => (
              <Grid item key={quiz.id} xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {quiz.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {quiz.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Typography variant="body2">
                        Questions: {quiz.questions.length}
                      </Typography>
                      <Typography variant="body2">
                        Time: {Math.floor(quiz.time_limit / 60)} minutes
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/quiz/take/${quiz.id}`)}
                    >
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  };

  if (showResults) {
    return renderResults();
  }

  return (quizId || videoId) ? renderQuiz() : renderQuizList();
};

export default Quiz;
