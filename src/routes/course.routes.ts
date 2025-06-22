import { Router } from 'express';
import { 
  getCourses, 
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleFavorite
} from '../controllers/course.controller';
import { checkAuthentication } from '../middleware/checkAuthentication';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getCourses);
router.get('/:id', getCourse);

router.post('/', checkAuthentication, upload.single('image'), createCourse);
router.put('/:id', checkAuthentication, upload.single('image'), updateCourse);
router.delete('/:id', checkAuthentication, deleteCourse);

router.post('/:id/favorite', checkAuthentication, toggleFavorite);

export default router;
