from datetime import datetime, timezone
from decimal import Decimal
from fastapi.responses import FileResponse
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Security, status, Response, Form, UploadFile, File
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials

from joblib import logger
import json

from sqlalchemy import update
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session
import shutil
import os
import logging
from pydantic import BaseModel
import pandas as pd
import joblib
import ml_utils
from db_setup import get_db, create_databases
from models import AI_Feedback, Message, Scoring_Criteria, User, Token
from auth import create_database_token, generate_token, get_current_user, get_password_hash, token_expiry
from passlib.context import CryptContext
import crud
import uvicorn
from models import Homework_Submission
from ml_service import ScoringService, scoring_service
from ml_service import ScoringService, scoring_service
from models import AI_Score, AI_Model_Metrics
from ml_utils import (
    calculate_steps_count,
    estimate_expected_steps,
    calculate_steps_completeness,
    calculate_reasoning_quality,
    calculate_method_appropriateness,
    calculate_representation_use,
    calculate_explanation_clarity,
    calculate_units_handling,
    calculate_language_quality,
    calculate_computational_errors,
    calculate_conceptual_errors,
    calculate_correctness_pct,
    calculate_time_minutes,
    calculate_external_aid_suspected,
    calculate_rubric_points_v2,predict_grade
)

import time

from models import Recommended_Resource,Student_Homework
from models import Homework_Submission
from models import  User,Homework,Subject_Class_Level,Grade,Student_Homework,File_Attachment
from models import Role ,School, Teacher, Student, Parent,Class_Level,Token,Subject,Guardian
from models import Token, AI_Score, AI_Model_Metrics

from schemas import UserOut,SchoolBase,SchoolCreate,SchoolUpdate,ClassLevelBase
from schemas import ClassLevelCreate,ClassLevelUpdate,SubjectBase,SubjectUpdate,SubjectCreate
from schemas import StudentBase,StudentCreate,StudentUpdate,StudentOut,TeacherUpdate,TeacherCreate,TeacherBase
from schemas import ParentBase,ParentCreate,ParentUpdate,ParentOut,StudentHomeworkBase,StudentHomeworkUpdate,StudentHomeworkCreate
from schemas import GuardianCreate,GuardianUpdate,GuardianOut,HomeworkCreate,HomeworkUpdate,HomeworkOut,HomeworkCreate
from schemas import SubjectClassLevelBase,SubjectClassLevelCreate,SubjectClassLevelUpdate,StudentHomeworkBase
from schemas import GradeBase,GradeCreate,GradeUpdate,StudentHomeworkCreate,StudentHomeworkUpdate,TeacherOut,StudentHomeworkOut
from schemas import FileAttachmentBase,FileAttachmentCreate,FileAttachmentUpdate,RecommendedResourceBase,RecommendedResourceCreate,RecommendedResourceUpdate
from schemas import HomeworkSubmissionCreate, HomeworkSubmissionResponse, HomeworkSubmissionUpdate
from schemas import RoleBase ,MessageBase,MessageCreate,MessageUpdate, SubjectClassLevelOut
from schemas import UserBase, UserIn, UserOut,GetUser, UpdateUser,RoleBase, RoleOut,RoleCreate,RoleUpdate,SchoolBase
from schemas import FeedbackRequest, FeedbackResponse, SaveFeedbackRequest, ScoreRequest, ScoreResponse, AIScoreCreate
from ml_service import inference_service, feedback_service 
from ml_service import FeedbackService
from ml_service import get_model, get_topic_encoder, get_feature_order
# Initialize the FastAPI app
app = FastAPI()
security = HTTPBearer()
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Get the current user from the token.
    """
    token = credentials.credentials  # Extract the token from the Authorization header
    db_token = db.query(Token).filter(Token.token == token).first()
    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return db_token.user
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
create_databases()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# ✅ Configure proper Python logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# ==========================================================
# 🧠 Load Machine Learning Model and Encoders
# ==========================================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

model = joblib.load(os.path.join(MODEL_DIR, "trained_model.pkl"))
feature_order = joblib.load(os.path.join(MODEL_DIR, "feature_order.pkl"))
grade_encoder = joblib.load(os.path.join(MODEL_DIR, "grade_encoder.pkl"))
topic_encoder = joblib.load(os.path.join(MODEL_DIR, "topic_encoder.pkl"))

print("✅ ML model and encoders loaded successfully!")
# ==========================================================
# 🤖 Load Teacher Feedback Model
# ==========================================================
try:
    feedback_model = joblib.load(os.path.join(MODEL_DIR, "teacher_feedback_model.pkl"))
    feedback_vectorizer = joblib.load(os.path.join(MODEL_DIR, "teacher_feedback_vectorizer.pkl"))
    print("✅ Teacher feedback model loaded successfully!")
except Exception as e:
    feedback_model = None
    feedback_vectorizer = None
    print(f"⚠️ Could not load teacher feedback model: {e}")

@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
   
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
       
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = create_database_token(user, db)
  

    return token_data



@app.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    """
    Logout the user by deleting the token from the database.
    """
    token = credentials.credentials  # Extract the token from the Authorization header
    db_token = db.query(Token).filter(Token.token == token).first()
    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    db.delete(db_token)
    db.commit()
    return {"message": "Logged out successfully"}


# Protected route example
@app.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    """
    A protected route that requires authentication.
    """
    return {"message": f"Hello, {current_user.username}!"}
@app.post("/auth/register", response_model=UserOut, status_code=201)
def register(
    user_params: UserIn,
    database: Session = Depends(get_db),
):
    # 1) Unique email
    if database.query(User).filter(User.email == user_params.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2) Resolve role safely (avoid letting a user pick 'Admin' directly)
    role = database.query(Role).filter(Role.id == user_params.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # 3) Create User FIRST
    hashed = get_password_hash(user_params.password)
    new_user = User(
        username=user_params.username,
        first_name=user_params.first_name,
        last_name=user_params.last_name,
        email=user_params.email,
        password=hashed,
        phone_number=user_params.phone_number,
        role=role,
        address=user_params.address,
        postal_code=user_params.postal_code,
        city=user_params.city,
        country=user_params.country,
    )
    database.add(new_user)
    database.commit()
    database.refresh(new_user)

    # 4) Create profile rows AFTER we have new_user.id
    if role.name == "Teacher" and getattr(user_params, "teacher", None):
        database.add(Teacher(
            user_id=new_user.id,
            subject_id=user_params.teacher.subject_id,
            qualifications=user_params.teacher.qualifications,
            photo=user_params.teacher.photo,
            employment_date=user_params.teacher.employment_date,
        ))
    elif role.name == "Student" and getattr(user_params, "student", None):
        database.add(Student(
            user_id=new_user.id,
            class_level_id=user_params.student.class_level_id,
            date_of_birth=user_params.student.date_of_birth,
        ))
    elif role.name == "Parent":
        database.add(Parent(user_id=new_user.id))

    database.commit()
    database.refresh(new_user)
    return new_user    

user_router = APIRouter(tags=["Users"])
@user_router.get("/users/", response_model=List[UserOut])
def read_users(current_user: User = Depends(get_current_user),
    database: Session = Depends(get_db)):
    """
     Hämtar alla användare från databasen.
    """
    users = database.query(User).all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    return users
@user_router.get("/user-profile")
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve the profile of the currently authenticated user.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
    }
@user_router.get("/users/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Retrieve a user by ID from the database.
    """
    user = database.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@user_router.post("/users/", response_model=UserOut)
def add_users(
    user_params: UserIn,
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Create a new user in the database.
    """
    # Check if the email is already registered
    existing_user = database.query(User).filter(User.email == user_params.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Query the Role model
    role_instance = database.query(Role).filter(Role.id == user_params.role_id).first()
    if not role_instance:
        raise HTTPException(status_code=404, detail="Role not found")

    if role_instance.name == "Teacher":
        teacher = Teacher(
            user_id=user_params.id,
            subject_id=user_params.teacher.subject_id,
            qualifications=user_params.teacher.qualifications,
            photo=user_params.teacher.photo,
            employment_date=user_params.teacher.employment_date
        )
        database.add(teacher)
        database.commit()
    elif role_instance.name == "Student":
        student = Student(
            user_id=user_params.id,
            class_level_id=user_params.student.class_level_id,
            date_of_birth=user_params.student.date_of_birth
        )
        database.add(student)
        database.commit()
    elif role_instance.name == "Parent":
        parent = Parent(
            user_id=user_params.id
        )
        database.add(parent)
        database.commit()

    # Hash the password before saving
    hashed_password = get_password_hash(user_params.password)
    new_user = User(
        username=user_params.username,
        first_name=user_params.first_name,
        last_name=user_params.last_name,
        email=user_params.email,
        password=hashed_password,  # Store the hashed password
        phone_number=user_params.phone_number,
        role=role_instance,  # Default role for new users
        address=user_params.address,
        postal_code=user_params.postal_code,
        city=user_params.city,
        country=user_params.country
    )
    database.add(new_user)
    database.commit()
    database.refresh(new_user)
    return new_user
    
@user_router.post("/get_user_by_email_and_password")
def get_user_by_email_and_password(
    user: GetUser,
    db: Session = Depends(get_db)
):
    """
    Authenticate the user and return a token.
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return create_database_token(db_user, db)
@user_router.delete("/users/{user_id}")
def delete_user_view(
    user_id: int,
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Delete a user from the database, including all related entities like tokens, teachers, and students.
    """
    # Check if the user exists
    user = database.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization check: Ensure the current user has the rights to delete another user
    if current_user.role.name != 'Admin':  # Assuming 'admin' role can delete users
        raise HTTPException(status_code=403, detail="Not authorized to delete this user")

    # Delete related tokens (cascade is handled by SQLAlchemy, but ensuring it's explicitly clear)
    database.query(Token).filter(Token.user_id == user_id).delete(synchronize_session=False)

    # If the user is a Teacher, delete related teacher profile
    if user.teacher:
        database.query(Teacher).filter(Teacher.user_id == user_id).delete(synchronize_session=False)

    # If the user is a Student, delete related student profile
    if user.student:
        database.query(Student).filter(Student.user_id == user_id).delete(synchronize_session=False)

    # If the user is a Parent, delete related parent profile
    if user.parent:
        database.query(Parent).filter(Parent.user_id == user_id).delete(synchronize_session=False)

    # Delete the user
    database.delete(user)
    database.commit()

    return {"message": f"User with ID {user_id} has been deleted successfully"}
@user_router.put("/users/{user_id}", response_model=UserBase)
def update_user_view(
    user_id: int,
    update_data: UpdateUser,
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Update a user by ID.
    Only authorized users can update (e.g., the user themselves or an admin).
    """
    # Check if the user exists
    user = database.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the current user has permission to update the user
    if current_user.id != user_id and current_user.role.name != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    # Update user fields
    if update_data.username:
        user.username = update_data.username
    if update_data.first_name:
        user.first_name = update_data.first_name
    if update_data.last_name:
        user.last_name = update_data.last_name
    if update_data.email:
        user.email = update_data.email
    if update_data.phone_number:
        user.phone_number = update_data.phone_number
    if update_data.address:
        user.address = update_data.address
    if update_data.postal_code:
        user.postal_code = update_data.postal_code
    if update_data.city:
        user.city = update_data.city
    if update_data.country:
        user.country = update_data.country

    # Commit the changes to the database
    database.commit()
    database.refresh(user)

    return user 
# Get all roles
@app.get("/roles", response_model=List[RoleBase])
def read_all_roles(
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Get all roles from the database.
    """
    # Ensure the user is authenticated or authorized (optional)
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    roles = database.query(Role).all()  # Fetch all roles from the database
    return database.query(Role).order_by(Role.id.asc()).all()

@app.post("/roles/", response_model=RoleBase, status_code=status.HTTP_201_CREATED)
def add_role(
    role_data: RoleCreate,
    current_user = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    # Ensure name is unique
    existing = database.query(Role).filter(Role.name == role_data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Role already exists")

    new_role = Role(name=role_data.name)
    database.add(new_role)
    database.commit()
    database.refresh(new_role)
    return new_role
@app.delete("/roles/{role_id}")
def delete_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    """
    Delete a role by ID from the database.
    """
    # Check if the user has necessary permissions (e.g., only admins can delete roles)
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete roles")

    # Check if the role exists
    role = database.query(Role).filter(Role.id == role_id).first()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Delete the role from the database
    database.delete(role)
    try:
        database.commit()
        print(f"Role {role_id} has been deleted.")
    except Exception as e:
        print(f"Error occurred: {e}")
        database.rollback()  # Rollback if there's an error

    return {"message": f"Role with ID {role_id} has been deleted successfully"}
@app.put("/roles/{role_id}", response_model=RoleBase)
def update_role(
    role_id: int, 
    role_update: RoleUpdate, 
    current_user: User = Depends(get_current_user),  # Validate token and authenticate user
    database: Session = Depends(get_db)
):
    """
    Update the name of a role in the database by role_id.
    """
    # Check if the user has necessary permissions (e.g., only admins can update roles)
    if current_user.role.name != "Admin":  # You can customize this check as per your role structure
        raise HTTPException(status_code=403, detail="Not authorized to update roles")

    # Check if the role exists
    role = database.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Update the role's attributes
    role.name = role_update.name  # Update the role name with the new value

    # Commit the changes to the database
    database.commit()

    # Return the updated role
    return role  # This will automatically be serialized into the RoleBase Pydantic model

@app.get("/schools", response_model=List[SchoolBase])
def read_all_schools(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all schools from the database. The request will be validated by checking the token.
    """
    schools = database.query(School).all()
    return schools

@app.post("/schools", response_model=SchoolBase)
def add_school(
    school_data: SchoolCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Add a new school to the database.
    """
    # Check if a school with the same name already exists
    existing_school = database.query(School).filter(School.name == school_data.name).first()
    if existing_school:
        raise HTTPException(status_code=400, detail="School with this name already exists")

    # Create and add the new school
    new_school = School(
        name=school_data.name,
        address=school_data.address,
        phone_number=school_data.phone_number
    )
    database.add(new_school)
    database.commit()
    database.refresh(new_school)

    return new_school

# Delete a school by ID
@app.delete("/schools/{school_id}", response_model=SchoolBase)
def delete_school(
    school_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Delete a school by its ID.
    """
    school = database.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Delete the school
    database.delete(school)
    database.commit()

    return school

# Update a school by ID
@app.put("/schools/{school_id}", response_model=SchoolBase)
def update_school(
    school_id: int,
    school_update: SchoolUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Update a school by ID.
    """
    school = database.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # Update the school's attributes
    if school_update.name:
        school.name = school_update.name
    if school_update.address:
        school.address = school_update.address
    if school_update.phone_number:
        school.phone_number = school_update.phone_number

    # Commit the changes to the database
    database.commit()
    database.refresh(school)
# Create a new class level
@app.post("/class_levels", response_model=ClassLevelBase)
def add_class_level(
    class_level_data: ClassLevelCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Add a new class level to the database.
    """
    # Check if the class level with the same name already exists
    existing_class_level = database.query(Class_Level).filter(Class_Level.name == class_level_data.name).first()
    if existing_class_level:
        raise HTTPException(status_code=400, detail="Class level with this name already exists")

    # Create and add the new class level
    new_class_level = Class_Level(
        name=class_level_data.name,
        school_id=class_level_data.school_id
    )
    database.add(new_class_level)
    database.commit()
    database.refresh(new_class_level)

    return new_class_level

# Get all class levels
@app.get("/class_levels", response_model=List[ClassLevelBase])
def read_all_class_levels(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all class levels from the database.
    """
    class_levels = database.query(Class_Level).all()
    return class_levels

# Update a class level by ID
@app.put("/class_levels/{class_level_id}", response_model=ClassLevelBase)
def update_class_level(
    class_level_id: int,
    class_level_update: ClassLevelUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Update a class level by its ID.
    """
    class_level = database.query(Class_Level).filter(Class_Level.id == class_level_id).first()
    if not class_level:
        raise HTTPException(status_code=404, detail="Class level not found")

    # Update the class level's attributes
    if class_level_update.name:
        class_level.name = class_level_update.name
    if class_level_update.school_id:
        class_level.school_id = class_level_update.school_id

    # Commit the changes to the database
    database.commit()
    database.refresh(class_level)

    return class_level

# Delete a class level by ID
@app.delete("/class_levels/{class_level_id}", response_model=ClassLevelBase)
def delete_class_level(
    class_level_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Delete a class level by its ID.
    """
    class_level = database.query(Class_Level).filter(Class_Level.id == class_level_id).first()
    if not class_level:
        raise HTTPException(status_code=404, detail="Class level not found")

    # Delete the class level
    database.delete(class_level)
    database.commit()

    return class_level
    return school   


@app.get("/subjects", response_model=List[SubjectBase])
def read_all_subjects(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all subjects from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all subjects from the database
    subjects = database.query(Subject).all()

    # Return the list of subjects
    return subjects
@app.post("/subjects", response_model=SubjectBase)
def add_subject(subject_data: SubjectCreate, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Add a new subject to the database.
    """
    # Check if the subject already exists
    existing_subject = database.query(Subject).filter(Subject.name == subject_data.name).first()
    if existing_subject:
        raise HTTPException(status_code=400, detail="Subject already exists")

    # Create the new subject
    new_subject = Subject(name=subject_data.name)
    database.add(new_subject)
    database.commit()
    database.refresh(new_subject)

    return new_subject    
@app.put("/subjects/{subject_id}", response_model=SubjectBase)
def update_subject(subject_id: int, subject_update: SubjectUpdate, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Update the subject by ID.
    """
    # Check if the subject exists
    subject = database.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Update the subject's name
    subject.name = subject_update.name

    # Commit the changes to the database
    database.commit()
    database.refresh(subject)

    return subject
@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Delete a subject by ID from the database.
    """
    # Check if the subject exists
    subject = database.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Delete the subject
    database.delete(subject)
    database.commit()

    return {"message": f"Subject with ID {subject_id} has been deleted successfully"}
    return subject  

@app.post("/students", response_model=StudentBase)
def create_student(
    student: StudentCreate,
    current_user: User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    """
    Create a new student.
    """
    # Check if user exists and is a student
    user = database.query(User).filter(User.id == student.user_id).first()
    if not user or user.role_id != 3:
        raise HTTPException(status_code=400, detail="User does not exist or is not a student")

    # Check if class level exists
    class_level = database.query(Class_Level).filter(Class_Level.id == student.class_level_id).first()
    if not class_level:
        raise HTTPException(status_code=400, detail="Class level does not exist")

    # Prevent duplicate student record
    if database.query(Student).filter(Student.user_id == student.user_id).first():
        raise HTTPException(status_code=400, detail="Student record already exists for this user")

    new_student = Student(
        date_of_birth=student.date_of_birth,
        user_id=student.user_id,
        class_level_id=student.class_level_id
    )
    database.add(new_student)
    database.commit()
    database.refresh(new_student)
    return new_student

# Read all students
# Get all students with token validation and user authentication
@app.get("/students", response_model=List[StudentOut])
def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),   # validates token
    database: Session = Depends(get_db),
):
    # Optional: role-based access (uncomment to restrict)
    # if current_user.role.name not in {"Admin", "Teacher"}:
    #     raise HTTPException(status_code=403, detail="Not allowed")

    students = (
        database.query(Student)
        .options(
            joinedload(Student.user).joinedload(User.role),
            joinedload(Student.class_level),
        )
        .order_by(Student.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return students
@app.get("/students/by_user/{user_id}", response_model=StudentOut)
def get_student_by_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Optional access control if you want:
    # if current_user.role.name not in ("Admin", "Teacher") and current_user.id != user_id:
    #     raise HTTPException(status_code=403, detail="Not authorized")

    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")
    return student
# Get student by ID with token validation and user authentication
@app.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, 
                current_user: User = Depends(get_current_user),  # Token validation and user authentication
                database: Session = Depends(get_db)):
    """
    Get a student by ID.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch the student from the database
    student = database.query(Student).filter(Student.id == student_id).first()
    
    # If the student is not found, raise an error
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Return the student details
    return student
@app.get("/student_homeworks", response_model=List[StudentHomeworkOut])
def get_all_student_homeworks(
    student_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Student_Homework).options(
        joinedload(Student_Homework.homework),
        joinedload(Student_Homework.student).joinedload(Student.user),
    )
    if student_id is not None:
        q = q.filter(Student_Homework.student_id == student_id)
    return q.all()
@app.get("/students/class_level/{class_level_id}", response_model=List[StudentOut])
def get_students_by_class_level(
    class_level_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all students from the same class level.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch students from the specified class level
    students = db.query(Student).filter(Student.class_level_id == class_level_id).options(joinedload(Student.user)).all()

    if not students:
        raise HTTPException(status_code=404, detail="No students found for the specified class level")

    return students

# Update a student
@app.put("/students/{student_id}", response_model=StudentBase)
def update_student(student_id: int, student_update: StudentUpdate, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Update a student's information.
    """
    student = database.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student_update.date_of_birth:
        student.date_of_birth = student_update.date_of_birth
    if student_update.user_id:
        student.user_id = student_update.user_id
    if student_update.class_level_id is not None:
        student.class_level_id = student_update.class_level_id

    database.commit()
    database.refresh(student)
    return student


# Delete a student
@app.delete("/students/{student_id}")
def delete_student(student_id: int, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Delete a student by ID.
    """
    student = database.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    database.delete(student)
    database.commit()
    return {"message": f"Student with ID {student_id} has been deleted successfully."} 
# Read all teachers
@app.get("/teachers", response_model=List[TeacherOut])
def get_all_teachers(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all teachers from the database.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Use the correct model name 'Teacher'
    teachers = database.query(Teacher).options(joinedload(Teacher.user)).all()
    
    return teachers

# Get a teacher by ID
@app.get("/teachers/{teacher_id}", response_model=TeacherOut)
def get_teacher_by_id(
    teacher_id: int,
    current_user: User = Depends(get_current_user),
    database: Session = Depends(get_db)
):
    """
    Get a teacher by ID.
    """
    # Debug log
    print(f"Fetching teacher with ID: {teacher_id}")

    teacher = (
        database.query(Teacher)
        .filter(Teacher.id == teacher_id)
        .first()
    )
    if not teacher:
        print(f"Teacher with ID {teacher_id} not found.")
        raise HTTPException(status_code=404, detail="Teacher not found")

    return teacher

# Add a new teacher
@app.post("/teachers", response_model=TeacherBase)
def add_teacher(
    teacher_data: TeacherCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Add a new teacher to the database.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check if the user already exists as a teacher
    existing_teacher = database.query(Teacher).filter(Teacher.user_id == teacher_data.user_id).first()
    if existing_teacher:
        raise HTTPException(status_code=400, detail="Teacher already exists")

    # Create a new teacher
    new_teacher = Teacher(
        user_id=teacher_data.user_id,
        subject_id=teacher_data.subject_id,
        qualifications=teacher_data.qualifications,
        photo=teacher_data.photo,
        employment_date=teacher_data.employment_date
    )

    # Add the new teacher to the database and commit
    database.add(new_teacher)
    database.commit()
    database.refresh(new_teacher)
    
    return new_teacher


# Update a teacher by ID
@app.put("/teachers/{teacher_id}", response_model=TeacherBase)
def update_teacher(
    teacher_id: int,
    teacher_update: TeacherUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Update a teacher by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    teacher = database.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Update the teacher's attributes
    teacher.qualifications = teacher_update.qualifications or teacher.qualifications
    teacher.photo = teacher_update.photo or teacher.photo
    teacher.subject_id = teacher_update.subject_id or teacher.subject_id
    teacher.employment_date = teacher_update.employment_date or teacher.employment_date
    
    # Commit the changes to the database
    database.commit()
    database.refresh(teacher)
    
    return teacher


# Delete a teacher by ID
@app.delete("/teachers/{teacher_id}", response_model=dict)
def delete_teacher(
    teacher_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Delete a teacher by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    teacher = database.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Delete the teacher
    database.delete(teacher)
    database.commit()

    return {"message": f"Teacher with ID {teacher_id} has been deleted successfully"} 
# Read all parents
@app.get("/parents", response_model=List[ParentOut])
def get_all_parents(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all parents from the database.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Fetch all parents from the database with their associated user details
    parents = database.query(Parent).options(joinedload(Parent.user)).all()

    # Return the list of parents
    return parents

# Get a parent by ID
@app.get("/parents/{parent_id}", response_model=ParentBase)
def get_parent_by_id(parent_id: int, database: Session = Depends(get_db)):
    """
    Get a parent by ID.
    """
    parent = database.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent


# Add a new parent
@app.post("/parents", response_model=ParentBase)
def add_parent(
    parent_data: ParentCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Add a new parent to the database.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check if the user already exists as a parent
    existing_parent = database.query(Parent).filter(Parent.user_id == parent_data.user_id).first()
    if existing_parent:
        raise HTTPException(status_code=400, detail="Parent already exists")

    # Create a new parent
    new_parent = Parent(
        user_id=parent_data.user_id
    )

    # Add the new parent to the database and commit
    database.add(new_parent)
    database.commit()
    database.refresh(new_parent)
    
    return new_parent


# Update a parent by ID
@app.put("/parents/{parent_id}", response_model=ParentBase)
def update_parent(
    parent_id: int,
    parent_update: ParentUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Update a parent by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    parent = database.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Update the parent's attributes (if provided)
    parent.user_id = parent_update.user_id or parent.user_id
    
    # Commit the changes to the database
    database.commit()
    database.refresh(parent)
    
    return parent


# Delete a parent by ID
@app.delete("/parents/{parent_id}", response_model=dict)
def delete_parent(
    parent_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Delete a parent by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    parent = database.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Delete the parent
    database.delete(parent)
    database.commit()

    return {"message": f"Parent with ID {parent_id} has been deleted successfully"}       
@app.get("/guardians", response_model=List[GuardianOut])
def get_all_guardians(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all guardians from the database.
    """
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        
        guardians = database.query(Guardian).options(joinedload(Guardian.parent), joinedload(Guardian.student)).all()
        return guardians
    except HTTPException as e:
        # Log the error or add additional handling here
        raise e
    except Exception as e:
        # Handle unexpected exceptions
        raise HTTPException(status_code=500, detail="Internal Server Error")
@app.post("/guardians", response_model=GuardianOut)
def add_guardian(
    guardian_data: GuardianCreate,  # Guardian data from the request body
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Add a new guardian to the database.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Ensure the parent and student exist before adding the guardian
    parent = database.query(Parent).filter(Parent.id == guardian_data.parent_id).first()
    student = database.query(Student).filter(Student.id == guardian_data.student_id).first()
    
    if not parent or not student:
        raise HTTPException(status_code=404, detail="Parent or Student not found")
    
    # Create the new guardian
    new_guardian = Guardian(
        parent_id=guardian_data.parent_id,
        student_id=guardian_data.student_id
    )
    
    # Add the guardian to the database
    database.add(new_guardian)
    database.commit()
    database.refresh(new_guardian)

    # Return the newly created guardian
    return new_guardian
@app.put("/guardians/{guardian_id}", response_model=GuardianOut)
def update_guardian(
    guardian_id: int,
    guardian_data: GuardianUpdate,  # Data to update the guardian
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Update a guardian by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Find the guardian by ID
    guardian = database.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    # Update the guardian’s attributes
    if guardian_data.parent_id:
        guardian.parent_id = guardian_data.parent_id
    if guardian_data.student_id:
        guardian.student_id = guardian_data.student_id
    
    # Commit the changes to the database
    database.commit()
    database.refresh(guardian)

    # Return the updated guardian
    return guardian
@app.delete("/guardians/{guardian_id}")
def delete_guardian(
    guardian_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Delete a guardian by ID.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Find the guardian by ID
    guardian = database.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    # Delete the guardian from the database
    database.delete(guardian)
    database.commit()

    # Return a message confirming the deletion
    return {"message": f"Guardian with ID {guardian_id} has been deleted successfully"} 
# Create Homework
@app.post("/homework/", response_model=HomeworkOut)
def add_homework(
    homework_data: HomeworkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scl = db.query(Subject_Class_Level).filter(
        Subject_Class_Level.id == homework_data.subject_class_level_id
    ).first()
    if not scl:
        raise HTTPException(status_code=404, detail="Subject class level not found")

    status_norm = homework_data.status.lower()
    if status_norm not in ("pending", "completed"):
        raise HTTPException(status_code=422, detail="status must be 'pending' or 'completed'")

    # Skapa ny läxa
    new_hw = Homework(
        title=homework_data.title,
        description=homework_data.description,
        due_date=homework_data.due_date,
        priority=homework_data.priority or "Normal",
        status=status_norm,
        completed_at=(datetime.now(timezone.utc) if status_norm == "completed" else None),
        subject_class_level_id=homework_data.subject_class_level_id,
    )
    db.add(new_hw)
    db.commit()
    db.refresh(new_hw)

    # Extrahera topic och beräkna difficulty_1to5
    topic = ml_utils.extract_topic_from_description(homework_data.description)
    difficulty = ml_utils.calculate_difficulty_from_description(homework_data.description)

    # Lägg till i Scoring_Criteria
    new_scoring_criteria = Scoring_Criteria(
        homework_id=new_hw.id,
        topic=topic,
        difficulty_1to5=difficulty
    )
    db.add(new_scoring_criteria)
    db.commit()

    # Returnera endast `new_hw` som matchar `HomeworkOut`
    return new_hw
@app.post("/student_homeworks", response_model=StudentHomeworkOut)
def create_student_homework(
    student_homework: StudentHomeworkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Remove the problematic field before creating the SQLAlchemy object
    data = student_homework.dict()
    data.pop("file_attachement_id", None)  # Remove if present
    db_student_homework = Student_Homework(**data)
    db.add(db_student_homework)
    db.commit()
    db.refresh(db_student_homework)
    return db_student_homework
@app.get("/homeworks", response_model=List[HomeworkOut])
def get_homeworks(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Fetch all homeworks.
    """
    homeworks = db.query(Homework).all()
    return homeworks
# Read Homework
@app.get("/homework/{homework_id}", response_model=HomeworkOut)
def get_homework(
    homework_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Retrieve a homework by ID.
    """
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    return homework

# Update Homework
@app.put("/homework/{homework_id}", response_model=HomeworkOut)
def update_homework(
    homework_id: int,
    homework_update: HomeworkUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a homework by ID.
    """
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    # Update homework fields
    if homework_update.title:
        homework.title = homework_update.title
    if homework_update.description:
        homework.description = homework_update.description
    if homework_update.due_date:
        homework.due_date = homework_update.due_date
    if homework_update.priority:
        homework.priority = homework_update.priority
    if homework_update.status:
        homework.status = homework_update.status

    db.commit()
    db.refresh(homework)

    return homework

# Delete Homework
@app.delete("/homework/{homework_id}")
def delete_homework(
    homework_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a homework by ID.
    """
    homework = db.query(Homework).filter(Homework.id == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")

    db.delete(homework)
    db.commit()

    return {"message": f"Homework with ID {homework_id} has been deleted successfully"}  
@app.post("/subject_class_levels", response_model=SubjectClassLevelBase)
def add_subject_class_level(
    subject_class_level_data: SubjectClassLevelCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new Subject_Class_Level to the database.
    """
    # Ensure the user has the necessary permissions (e.g., admin or teacher)
    if current_user.role.name not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to add subject class levels")

    # Ensure the class level, subject, and teacher exist
    class_level = db.query(Class_Level).filter(Class_Level.id == subject_class_level_data.class_level_id).first()
    subject = db.query(Subject).filter(Subject.id == subject_class_level_data.subject_id).first()
    teacher = db.query(Teacher).filter(Teacher.id == subject_class_level_data.teacher_id).first()

    if not class_level or not subject or not teacher:
        raise HTTPException(status_code=404, detail="Class level, subject, or teacher not found")

    # Create the new Subject_Class_Level
    new_subject_class_level = Subject_Class_Level(
        class_level_id=subject_class_level_data.class_level_id,
        subject_id=subject_class_level_data.subject_id,
        teacher_id=subject_class_level_data.teacher_id
    )
    db.add(new_subject_class_level)
    db.commit()
    db.refresh(new_subject_class_level)

    return new_subject_class_level  





from ml_utils import predict_grade

@app.post("/homework_submissions/", response_model=HomeworkSubmissionResponse)
async def create_homework_submission(
    submission: HomeworkSubmissionCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a student's homework submission, predict grade, and store AI feedback."""
    try:
        logger.info(f"📥 Received submission data: {submission.dict()}")

        # --- Validate ownership and existence ---
        student_homework = (
            db.query(Student_Homework)
            .filter(Student_Homework.id == submission.student_homework_id)
            .first()
        )
        if not student_homework:
            raise HTTPException(status_code=404, detail="Student homework not found")

        student = db.query(Student).filter(Student.id == student_homework.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to submit for this homework")

        # --- Create or update submission ---
        existing_submission = (
            db.query(Homework_Submission)
            .filter(Homework_Submission.student_homework_id == submission.student_homework_id)
            .first()
        )

        if existing_submission:
            logger.info(f"🔁 Updating existing submission ID {existing_submission.id}")
            existing_submission.submission_text = submission.submission_text
            existing_submission.submission_file_id = submission.submission_file_id
            existing_submission.submission_date = submission.submission_date
            existing_submission.status = submission.status
            existing_submission.is_late = submission.is_late
            db.commit()
            db.refresh(existing_submission)
            new_submission = existing_submission
        else:
            logger.info("🆕 Creating new submission...")
            new_submission = Homework_Submission(
                student_homework_id=submission.student_homework_id,
                submission_text=submission.submission_text,
                submission_file_id=submission.submission_file_id,
                submission_date=submission.submission_date,
                status=submission.status,
                is_late=submission.is_late,
            )
            db.add(new_submission)
            db.commit()
            db.refresh(new_submission)

        # --- Retrieve scoring criteria ---
        scoring = (
            db.query(Scoring_Criteria)
            .filter(Scoring_Criteria.homework_id == student_homework.homework_id)
            .first()
        )
        if not scoring:
            raise HTTPException(status_code=404, detail="Scoring criteria not found for this homework")

        # --- Calculate scoring metrics ---
        steps_count = calculate_steps_count(submission.submission_text)
        expected_steps = estimate_expected_steps(scoring.topic, scoring.difficulty_1to5)
        steps_completeness = round(min(steps_count / expected_steps, 1.0), 2)
        reasoning_quality = calculate_reasoning_quality(submission.submission_text)
        method_appropriateness = calculate_method_appropriateness(
            submission.submission_text, student_homework.homework.description
        )
        representation_use = calculate_representation_use(submission.submission_text)
        explanation_clarity = calculate_explanation_clarity(submission.submission_text)
        units_handling = calculate_units_handling(submission.submission_text)
        language_quality = calculate_language_quality(submission.submission_text)
        computational_errors = calculate_computational_errors(submission.submission_text)
        conceptual_errors = calculate_conceptual_errors(submission.submission_text)
        correctness_pct = calculate_correctness_pct(submission.submission_text, expected_answer="")
        time_minutes = calculate_time_minutes(datetime.now(), datetime.now())
        external_aid_suspected_score = calculate_external_aid_suspected(submission.submission_text)
        external_aid_suspected = external_aid_suspected_score > 0.5
        originality_score = round(1.0 - external_aid_suspected_score, 2)
        rubric_points = calculate_rubric_points_v2(
            method_appropriateness, computational_errors, explanation_clarity, units_handling
        )

        # --- Prepare feature dict ---
        features = {
            "topic": scoring.topic,
            "difficulty_1to5": scoring.difficulty_1to5,
            "steps_count": steps_count,
            "steps_completeness": steps_completeness,
            "reasoning_quality": reasoning_quality,
            "method_appropriateness": method_appropriateness,
            "representation_use": representation_use,
            "explanation_clarity": explanation_clarity,
            "units_handling": units_handling,
            "language_quality": language_quality,
            "computational_errors": computational_errors,
            "conceptual_errors": conceptual_errors,
            "correctness_pct": correctness_pct,
            "originality_score": originality_score,
            "rubric_points": rubric_points,
        }

        # --- Predict grade ---
        predicted_grade = predict_grade(model, feature_order, grade_encoder, topic_encoder, features)

        # --- Generate AI Teacher Feedback ---
        teacher_comment = "Bra försök! Fortsätt öva på att motivera varje steg tydligare."
        criteria_met, criteria_missed, improvement_suggestions = [], [], []

        try:
            if feedback_model and feedback_vectorizer:
                teacher_data = pd.read_csv("klass9_matte_inlamningar_dataset.csv")
                teacher_comment = ml_utils.generate_teacher_feedback(
                    feedback_model,
                    feedback_vectorizer,
                    teacher_data["teacher_comment_sv"],
                    submission.submission_text,
                )
        except Exception as e:
            logger.warning(f"⚠️ Feedback generation failed: {e}")

        # --- Simple AI rules for criteria met/missed ---
        if reasoning_quality > 0.7:
            criteria_met.append("God resonemangsförmåga")
        else:
            criteria_missed.append("Bristande resonemang")

        if explanation_clarity > 0.7:
            criteria_met.append("Tydlig förklaring")
        else:
            criteria_missed.append("Förklaring behöver utvecklas")

        if method_appropriateness > 0.7:
            criteria_met.append("Korrekt metodval")
        else:
            criteria_missed.append("Metodval behöver förbättras")

        if computational_errors > 0:
            improvement_suggestions.append("Kontrollera beräkningarna – ett eller flera räknefel upptäcktes.")

        if conceptual_errors > 0:
            improvement_suggestions.append("Gå igenom de matematiska begreppen för att undvika missförstånd.")

        if not improvement_suggestions:
            improvement_suggestions.append("Fortsätt på samma sätt! Du visar tydligt förståelse.")

        # --- Save AI_Feedback ---
        ai_feedback = AI_Feedback(
            homework_submission_id=new_submission.id,
            feedback_text=teacher_comment,
            feedback_type="teacher_comment_sv",
            criteria_met=", ".join(criteria_met),
            criteria_missed=", ".join(criteria_missed),
            improvement_suggestions=" ".join(improvement_suggestions),
            model_used="EduMate_TeacherFeedback_v2",
        )
        db.add(ai_feedback)
        db.commit()
        db.refresh(ai_feedback)

        # --- Save AI Score ---
        ai_score = AI_Score(
            homework_submission_id=new_submission.id,
            predicted_score=int(rubric_points),
            predicted_band=predicted_grade,
            prediction_model_version="EduMate_RF_v1",
            predicted_at=datetime.now(timezone.utc),
            confidence_level=Decimal("0.95"),
            analysis_data=json.dumps(features, ensure_ascii=False),
        )
        db.add(ai_score)
        db.commit()
        db.refresh(ai_score)

        logger.info(f"✅ Submission {new_submission.id} processed — Grade: {predicted_grade}")

        # --- Return API Response ---
        return {
            "id": new_submission.id,
            "student_homework_id": new_submission.student_homework_id,
            "submission_date": new_submission.submission_date.isoformat() if new_submission.submission_date else None,

            "status": new_submission.status,
            "is_late": new_submission.is_late,
            "predicted_grade": predicted_grade,
            "rubric_points": rubric_points,
            "ai_teacher_feedback": teacher_comment,
            "criteria_met": criteria_met,
            "criteria_missed": criteria_missed,
            "improvement_suggestions": improvement_suggestions,
            "confidence": 0.95
        }

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creating submission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create submission: {str(e)}")



@app.get("/homework_submissions/all", response_model=List[dict])
def get_all_homework_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch all homework submissions from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Query all homework submissions
    submissions = db.query(Homework_Submission).all()

    # Format the response to ensure proper date handling
    result = []
    for submission in submissions:
        result.append({
            "id": submission.id,
            "student_homework_id": submission.student_homework_id,
            "submission_text": submission.submission_text,
            "submission_file_id": submission.submission_file_id,
            "submission_date": str(submission.submission_date),  # Ensure it's a string
            "status": submission.status,
            "is_late": submission.is_late,
            "teacher_feedback": getattr(submission, 'teacher_feedback', None),
            "grade_value": getattr(submission, 'grade_value', None)
        })

    return result
# Get homework submissions with optional filtering
@app.get("/homework_submissions/", response_model=list[dict])
def get_homework_submissions(
    student_homework_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get homework submissions with optional filtering"""
    query = db.query(Homework_Submission)
    
    if student_homework_id:
        query = query.filter(Homework_Submission.student_homework_id == student_homework_id)
    
    if student_id:
        query = query.join(Student_Homework).filter(Student_Homework.student_id == student_id)
    
    submissions = query.all()
    
    # Manually format the response to ensure proper date handling
    result = []
    for submission in submissions:
        result.append({
            "id": submission.id,
            "student_homework_id": submission.student_homework_id,
            "submission_text": submission.submission_text,
            "submission_file_id": submission.submission_file_id,
            "submission_date": str(submission.submission_date),  # Ensure it's a string
            "status": submission.status,
            "is_late": submission.is_late,
            "teacher_feedback": getattr(submission, 'teacher_feedback', None),
            "grade_value": getattr(submission, 'grade_value', None)
        })
    
    return result

@app.get("/files/{file_id}/download")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Download a file by its ID"""
    
    # Get file attachment record
    file_attachment = db.query(File_Attachment).filter(
        File_Attachment.id == file_id
    ).first()
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if file exists on disk
    if not os.path.exists(file_attachment.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found")
    
    # Return file for download
    return FileResponse(
        path=file_attachment.file_path,
        filename=file_attachment.file_name or "download",
        media_type='application/octet-stream'
    )


# Update your file upload endpoint:

@app.post("/file_attachments")
async def upload_file_attachment(
    file: UploadFile = File(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file and create a File_Attachment record.
    """
    try:
        logger.info(f"File upload attempt by user {current_user.id}: {file.filename}")
        
        # Ensure the user has the necessary permissions
        if current_user.role.name not in ["Teacher", "Admin", "Student"]:
            raise HTTPException(status_code=403, detail="Not authorized to upload files")

        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/attachments"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{current_user.id}_{timestamp}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved to: {file_path}")
        
        # Create file attachment record in database
        new_file_attachment = File_Attachment(
            file_name=file.filename or unique_filename,
            file_path=file_path,
            description=description or f"File uploaded by {current_user.username}"
        )
        db.add(new_file_attachment)
        db.commit()
        db.refresh(new_file_attachment)
        
        logger.info(f"File attachment created with ID: {new_file_attachment.id}")
        
        return {
            "id": new_file_attachment.id,
            "file_name": new_file_attachment.file_name,
            "file_path": new_file_attachment.file_path,
            "description": new_file_attachment.description,
            "message": "File uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        # Clean up file if database operation fails
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
@app.get("/subject_class_levels", response_model=List[SubjectClassLevelOut])
def get_all_subject_class_levels(
    user_id: int = None,  # Optional user ID to filter by user
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all Subject_Class_Level entries from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Not authorized to view subject class levels")
    # Fetch all Subject_Class_Level entries
    subject_class_levels = db.query(Subject_Class_Level).filter(teacher.id == Subject_Class_Level.teacher_id).all()

    return subject_class_levels     
@app.put("/subject_class_levels/{subject_class_level_id}", response_model=SubjectClassLevelBase)
def update_subject_class_level(
    subject_class_level_id: int,
    subject_class_level_update: SubjectClassLevelUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a Subject_Class_Level by ID.
    """
    # Ensure the user has the necessary permissions (e.g., admin or teacher)
    if current_user.role.name not in ["Admin", "Teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized to update subject class levels")

    # Fetch the Subject_Class_Level entry
    subject_class_level = db.query(Subject_Class_Level).filter(Subject_Class_Level.id == subject_class_level_id).first()
    if not subject_class_level:
        raise HTTPException(status_code=404, detail="Subject_Class_Level not found")

    # Update the fields
    if subject_class_level_update.class_level_id:
        subject_class_level.class_level_id = subject_class_level_update.class_level_id
    if subject_class_level_update.subject_id:
        subject_class_level.subject_id = subject_class_level_update.subject_id
    if subject_class_level_update.teacher_id:
        subject_class_level.teacher_id = subject_class_level_update.teacher_id

    db.commit()
    db.refresh(subject_class_level)

    return subject_class_level   
@app.delete("/subject_class_levels/{subject_class_level_id}")
def delete_subject_class_level(
    subject_class_level_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a Subject_Class_Level by ID.
    """
    # Ensure the user has the necessary permissions (e.g., admin)
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete subject class levels")

    # Fetch the Subject_Class_Level entry
    subject_class_level = db.query(Subject_Class_Level).filter(Subject_Class_Level.id == subject_class_level_id).first()
    if not subject_class_level:
        raise HTTPException(status_code=404, detail="Subject_Class_Level not found")

    # Delete the entry
    db.delete(subject_class_level)
    db.commit()

    return {"message": f"Subject_Class_Level with ID {subject_class_level_id} has been deleted successfully"} 
# --- Grade Endpoints ---
@app.post("/grades", response_model=GradeBase)
def add_grade(
    grade_data: GradeCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new grade to the database and update the Homework_Submission table.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to add grades")

    # Ensure the student_homework exists
    student_homework = db.query(Student_Homework).filter(Student_Homework.id == grade_data.student_homework_id).first()
    if not student_homework:
        raise HTTPException(status_code=404, detail="Student homework not found")

    # Create the new grade
    new_grade = Grade(
        grade=grade_data.grade,
        description=grade_data.description,
        feedback=grade_data.feedback,
        student_homework_id=grade_data.student_homework_id
    )
    db.add(new_grade)
    db.commit()
    db.refresh(new_grade)

    # Update the Homework_Submission table with the grade and feedback
    homework_submission = db.query(Homework_Submission).filter(
        Homework_Submission.student_homework_id == grade_data.student_homework_id
    ).first()

    if homework_submission:
        homework_submission.teacher_feedback = grade_data.feedback
        homework_submission.status = "graded"  # Update the status to indicate grading is complete
        homework_submission.grade_value = grade_data.grade  # Update the grade value
        db.commit()
        db.refresh(homework_submission)

    return new_grade
# --- Student Endpoints ---
students_router = APIRouter(prefix="/students", tags=["students"])

@students_router.get("/by_user/{user_id}", response_model=StudentOut)
def get_student_by_user(user_id: int, db: Session = Depends(get_db)):
    student = (
        db.query(Student)
        .options(joinedload(Student.user))   # so StudentOut.user is populated
        .filter(Student.user_id == user_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found for this user_id")
    return student  
@app.get("/betyg/me", response_model=List[GradeBase])
def get_my_betyg(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all grades for the currently logged-in student.
    Only students can access their own grades here.
    """
    if current_user.role.name != "Student":
        raise HTTPException(status_code=403, detail="Only students can access their own grades here.")

    # Find the student record for the current user
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")

    grades = (
        db.query(Grade)
        .join(Grade.student_homework)
        .filter(Student_Homework.student_id == student.id)
        .all()
    )
    return grades
@app.get("/grades/by_student/{student_id}", response_model=List[GradeBase])
def get_grades_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch grades for a specific student by their student_id.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Role-based access control
    if current_user.role.name == "Student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Students can only access their own grades.")
    elif current_user.role.name not in ["Teacher", "Admin"] and current_user.role.name != "Student":
        raise HTTPException(status_code=403, detail="Not authorized to view grades.")

    # Query grades for the specified student
    grades = (
        db.query(Grade)
        .join(Student_Homework, Grade.student_homework_id == Student_Homework.id)
        .filter(Student_Homework.student_id == student_id)
        .all()
    )

    # If no grades are found, raise an exception
    if not grades:
        raise HTTPException(status_code=404, detail="No grades found for the specified student.")

    return grades
@app.get("/grades", response_model=List[GradeBase])
def get_all_grades(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all grades from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all grades
    grades = db.query(Grade).all()

    return grades
@app.put("/grades/{grade_id}", response_model=GradeBase)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a grade by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to update grades")

    # Fetch the grade
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    # Update the grade fields
    if grade_update.grade:
        grade.grade = grade_update.grade
    if grade_update.description:
        grade.description = grade_update.description
    if grade_update.feedback:
        grade.feedback = grade_update.feedback

    db.commit()
    db.refresh(grade)

    return grade
# Get grade by submission_id
@app.get("/grades/by_submission/{submission_id}", response_model=GradeBase)
def get_grade_by_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the grade for a specific homework submission by submission_id.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Query the Homework_Submission table to ensure the submission exists
    submission = db.query(Homework_Submission).filter(Homework_Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Homework submission not found")

    # Query the Grade table to fetch the grade for the submission
    grade = db.query(Grade).filter(Grade.student_homework_id == submission.student_homework_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found for this submission")

    return grade
# by a student user id

@app.get("/betyg/user/{user_id}", response_model=List[GradeBase])
def get_betyg_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return all grades for the student linked to this user_id.
    - Students can only access their own grades.
    - Teachers/Admins can access any student's grades.
    """
    # Only allow students to access their own grades
    if current_user.role.name == "Student" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Students can only access their own grades.")

    # Find the student record that belongs to this user
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this user")

    grades = (
        db.query(Grade)
        .join(Grade.student_homework)
        .filter(Student_Homework.student_id == student.id)
        .all()
    )
    return grades

# by student_id (direct)
@app.get("/grades/by_student/{student_id}", response_model=List[GradeBase])
def grades_by_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Grade)
          .join(Grade.student_homework)
          .filter(Student_Homework.student_id == student_id)
          .all()
    )    
@app.delete("/grades/{grade_id}")
def delete_grade(
    grade_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a grade by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to delete grades")

    # Fetch the grade
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")

    # Delete the grade
    db.delete(grade)
    db.commit()

    return {"message": f"Grade with ID {grade_id} has been deleted successfully"} 

    return student_homeworks
 # Create router for student_homeworks
student_hw_router = APIRouter(prefix="/student_homeworks", tags=["Student Homeworks"])
@student_hw_router.get("/", response_model=List[StudentHomeworkOut])
def list_student_homeworks(
    student_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns student_homeworks filtered by:
      - student_id query param (if provided), else
      - current_user if they are a Student (only their own rows), else
      - all rows for Teachers/Admins
    """
    q = db.query(Student_Homework).options(
        joinedload(Student_Homework.homework).joinedload(Homework.subject_class_level).joinedload(Subject_Class_Level.subject),
        joinedload(Student_Homework.student).joinedload(Student.user),
        joinedload(Student_Homework.file_attachment),
    )

    if student_id is not None:
        q = q.filter(Student_Homework.student_id == student_id)
    else:
        # If the logged in user is a Student, show only their rows
        if current_user.role.name == "Student":
            # find their Student.id
            student = db.query(Student).filter(Student.user_id == current_user.id).first()
            if not student:
                return []
            q = q.filter(Student_Homework.student_id == student.id)

    return q.order_by(Student_Homework.id.desc()).all()
@student_hw_router.delete("/{student_homework_id}", status_code=204)
def delete_student_homework(
    student_homework_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sh = db.query(Student_Homework).filter(Student_Homework.id == student_homework_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail="Student_Homework not found")

    is_owner = sh.student and sh.student.user_id == current_user.id
    if current_user.role.name not in ("Admin", "Teacher") and not is_owner:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(sh)
    db.commit()
    return Response(status_code=204)
@student_hw_router.patch("/{student_homework_id}", response_model=StudentHomeworkOut)
@app.patch("/student_homeworks/{student_homework_id}/complete")
def mark_student_homework_complete(
    student_homework_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sh = db.query(Student_Homework).filter(Student_Homework.id == student_homework_id).first()
    if not sh:
        raise HTTPException(status_code=404, detail="Student_Homework not found")

    if sh.homework.status != "completed":
        sh.homework.status = "completed"
        sh.homework.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(sh)

    return sh


app.include_router(student_hw_router)

@app.put("/homeworks/{homework_id}", response_model=HomeworkOut)
def update_homework(homework_id: int, payload: HomeworkUpdate,
                    current_user: User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized")

    hw = db.query(Homework).filter(Homework.id == homework_id).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")

    data = payload.model_dump(exclude_unset=True)
    if "status" in data:
        status = (data["status"] or "").lower()
        if status not in ("pending", "completed"):
            raise HTTPException(status_code=422, detail="Invalid status")
        if status == "completed" and hw.completed_at is None:
            hw.completed_at = datetime.now(timezone.utc)
        if status == "pending":
            hw.completed_at = None
        data["status"] = status

    for k, v in data.items():
        setattr(hw, k, v)

    db.commit()
    db.refresh(hw)
    return hw
    
# --- Meddelanden management endpoints for teachers ---
@app.get("/meddelanden/", response_model=List[MessageBase])
def get_all_meddelanden(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all messages (meddelanden) in the system. Teachers/Admins only.
    """
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all messages.")
    return db.query(Message).all()

@app.post("/meddelanden/", response_model=MessageBase)
def add_meddelande(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new message (meddelande). Teachers/Admins only.
    """
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to add messages.")
    recipient = db.query(User).filter(User.id == message_data.recipient_user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")
    new_message = Message(
        message=message_data.message,
        read_status=message_data.read_status or "Unread",
        recipient_user_id=message_data.recipient_user_id,
        sender_user_id=current_user.id,
    
        homework_id=getattr(message_data, "homework_id", None),
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@app.put("/meddelanden/{message_id}/", response_model=MessageBase)
def update_meddelande(
    message_id: int,
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a message (meddelande) by ID. Teachers/Admins only.
    """
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update messages.")
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message_update.message:
        message.message = message_update.message
    if hasattr(message_update, "description") and message_update.description is not None:
        message.description = message_update.description
    if hasattr(message_update, "read_status") and message_update.read_status is not None:
        message.read_status = message_update.read_status
    if hasattr(message_update, "homework_id") and message_update.homework_id is not None:
        message.homework_id = message_update.homework_id
    db.commit()
    db.refresh(message)
    return message

@app.delete("/meddelanden/{message_id}/")
def delete_meddelande(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a message (meddelande) by ID. Teachers/Admins only.
    """
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete messages.")
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    return {"message": f"Message with ID {message_id} has been deleted successfully"}
@app.post("/file_attachments", response_model=FileAttachmentBase)
def add_file_attachment(
    file_attachment_data: FileAttachmentCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new File_Attachment to the database.
    """
    # Ensure the user has the necessary permissions (e.g., teacher or admin)
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to add file attachments")

    # Create the new File_Attachment
    new_file_attachment = File_Attachment(
        file_name=file_attachment_data.file_name,
        file_path=file_attachment_data.file_path,
        description=file_attachment_data.description
    )
    db.add(new_file_attachment)
    db.commit()
    db.refresh(new_file_attachment)

    return new_file_attachment


@app.get("/file_attachments/{file_attachment_id}")
def get_file_attachment(
    file_attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific File_Attachment by ID.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch the File_Attachment entry
    file_attachment = db.query(File_Attachment).filter(
        File_Attachment.id == file_attachment_id
    ).first()
    
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File_Attachment not found")

    return {
        "id": file_attachment.id,
        "file_name": file_attachment.file_name,
        "file_path": file_attachment.file_path,
        "description": file_attachment.description,
        "created_at": file_attachment.created_at,
        "updated_at": file_attachment.updated_at
    }




# Add the file upload endpoint
@app.post("/file_attachments")
async def add_file_attachment(
    file: UploadFile = File(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new File_Attachment to the database with file upload.
    """
    try:
        # Ensure the user has the necessary permissions
        if current_user.role.name not in ["Teacher", "Admin", "Student"]:
            raise HTTPException(status_code=403, detail="Not authorized to upload files")

        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/attachments"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{current_user.id}_{timestamp}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create file attachment record in database
        new_file_attachment = File_Attachment(
            file_name=file.filename or unique_filename,
            file_path=file_path,
            description=description or f"File uploaded by {current_user.username}"
        )
        db.add(new_file_attachment)
        db.commit()
        db.refresh(new_file_attachment)
        
        return {
            "id": new_file_attachment.id,
            "file_name": new_file_attachment.file_name,
            "file_path": new_file_attachment.file_path,
            "description": new_file_attachment.description,
            "message": "File uploaded successfully"
        }
        
    except Exception as e:
        # Clean up file if database operation fails
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# ...rest of your existing endpoints...
@app.put("/file_attachments/{file_attachment_id}", response_model=FileAttachmentBase)
def update_file_attachment(
    file_attachment_id: int,
    file_attachment_update: FileAttachmentUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a File_Attachment by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher or admin)
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update file attachments")

    # Fetch the File_Attachment entry
    file_attachment = db.query(File_Attachment).filter(File_Attachment.id == file_attachment_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File_Attachment not found")

    # Update the fields
    if file_attachment_update.file_name:
        file_attachment.file_name = file_attachment_update.file_name
    if file_attachment_update.file_path:
        file_attachment.file_path = file_attachment_update.file_path
    if file_attachment_update.description:
        file_attachment.description = file_attachment_update.description

    db.commit()
    db.refresh(file_attachment)

    return file_attachment  
@app.delete("/file_attachments/{file_attachment_id}")
def delete_file_attachment(
    file_attachment_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a File_Attachment by ID.
    """
    # Ensure the user has the necessary permissions (e.g., admin)
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete file attachments")

    # Fetch the File_Attachment entry
    file_attachment = db.query(File_Attachment).filter(File_Attachment.id == file_attachment_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File_Attachment not found")

    # Delete the entry
    db.delete(file_attachment)
    db.commit()

    return {"message": f"File_Attachment with ID {file_attachment_id} has been deleted successfully"}        
@app.post("/recommended_resources", response_model=RecommendedResourceBase)
def add_recommended_resource(
    resource_data: RecommendedResourceCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new Recommended_Resource to the database.
    """
    # Ensure the user has the necessary permissions (e.g., teacher or admin)
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to add recommended resources")

    # Ensure the subject exists
    subject = db.query(Subject).filter(Subject.id == resource_data.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Create the new Recommended_Resource
    new_resource = Recommended_Resource(
        title=resource_data.title,
        url=resource_data.url,
        description=resource_data.description,
        subject_id=resource_data.subject_id
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)

    return new_resource  
@app.get("/recommended_resources", response_model=List[RecommendedResourceBase])
def get_all_recommended_resources(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all Recommended_Resource entries from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all Recommended_Resource entries
    resources = db.query(Recommended_Resource).all()

    return resources
@app.put("/recommended_resources/{resource_id}", response_model=RecommendedResourceBase)
def update_recommended_resource(
    resource_id: int,
    resource_update: RecommendedResourceUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a Recommended_Resource by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher or admin)
    if current_user.role.name not in ["Teacher", "Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update recommended resources")

    # Fetch the Recommended_Resource entry
    resource = db.query(Recommended_Resource).filter(Recommended_Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Recommended_Resource not found")

    # Update the fields
    if resource_update.title:
        resource.title = resource_update.title
    if resource_update.url:
        resource.url = resource_update.url
    if resource_update.description:
        resource.description = resource_update.description

    db.commit()
    db.refresh(resource)

    return resource
@app.delete("/recommended_resources/{resource_id}")
def delete_recommended_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a Recommended_Resource by ID.
    """
    # Ensure the user has the necessary permissions (e.g., admin)
    if current_user.role.name != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete recommended resources")

    # Fetch the Recommended_Resource entry
    resource = db.query(Recommended_Resource).filter(Recommended_Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Recommended_Resource not found")

    # Delete the entry
    db.delete(resource)
    db.commit()

    return {"message": f"Recommended_Resource with ID {resource_id} has been deleted successfully"} 




from ml_service import scoring_service  # Importera ScoringService-instansen

# Endpoint to get AI score by submission_id
@app.get("/ai_scores/by_submission/{submission_id}")
def get_ai_score_by_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the latest AI score for a specific homework submission by submission_id.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Query the AI_Score table to fetch the latest AI score for the submission
    ai_score = db.query(AI_Score).filter(AI_Score.homework_submission_id == submission_id).order_by(AI_Score.predicted_at.desc()).first()
    if not ai_score:
        raise HTTPException(status_code=404, detail="AI score not found for this submission")

    return ai_score
# Keep your existing endpoints but update them to work with the new system
@app.post("/ml/score", response_model=ScoreResponse)
def score_endpoint(request: ScoreRequest, db: Session = Depends(get_db)):
    scoring_service = ScoringService()

    # Perform scoring
    result = scoring_service.score_submission(request.text, request.subject)

    # Save the AI score record
    ai_score_record = scoring_service.create_ai_score_record(
        db=db,
        submission_id=request.submission_id,
        result=result
    )

    return ScoreResponse(
        submission_id=request.submission_id,
        predicted_score=ai_score_record.predicted_score,
        predicted_band=ai_score_record.predicted_band,
        confidence=ai_score_record.confidence_level,
        reason=ai_score_record.prediction_explainer,
        processing_time_ms=123,  # Example placeholder
        timestamp=ai_score_record.predicted_at,
        model_used=ai_score_record.model_used
    )

# Health check endpoint
@app.get("/api/ml/health")
async def ml_health_check():
    """Check if the ML service is healthy"""
    try:
        _ = get_model()
        _ = get_topic_encoder()
        _ = get_feature_order()
        status = "healthy"
    except Exception as e:
        status = f"unhealthy: {e}"

    return {
        "status": status,
        "model_version": "xgboost_json_v1",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": {
            "score": "/ml/score",
            "score_text": "/api/ml/score-text",
            "health": "/api/ml/health"
        }
    }
@app.post("/homework_submissions/{submission_id}/generate-feedback")
def generate_feedback_for_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates AI feedback for a submission if none exists.
    """
    submission = db.query(Homework_Submission).filter_by(id=submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Check if feedback already exists
    existing_feedback = (
        db.query(AI_Feedback)
        .filter(AI_Feedback.homework_submission_id == submission_id)
        .first()
    )
    if existing_feedback:
        return {
            "message": "Feedback already exists",
            "feedback": {
                "feedback_text": existing_feedback.feedback_text,
                "improvement_suggestions": existing_feedback.improvement_suggestions,
                "created_at": existing_feedback.created_at
            }
        }

    # ⚙️ Example: simple mock feedback (replace this with your AI model call)
    ai_feedback_text = (
        "Bra jobbat! Din lösning visar förståelse för problemet, "
        "men du kan utveckla resonemanget och visa fler steg i beräkningarna."
    )
    ai_suggestions = (
        "Förbättra genom att visa alla uträkningar och förklara varför du valde dina metoder."
    )

    new_feedback = AI_Feedback(
        homework_submission_id=submission_id,
        feedback_text=ai_feedback_text,
        feedback_type="AI",
        improvement_suggestions=ai_suggestions,
        created_at=datetime.now()
    )

    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)

    return {
        "message": "✅ AI feedback generated successfully",
        "feedback": {
            "feedback_text": new_feedback.feedback_text,
            "improvement_suggestions": new_feedback.improvement_suggestions,
            "created_at": new_feedback.created_at
        }
    }
@app.get("/homework_submissions/{submission_id}/feedback")
def get_homework_feedback(submission_id: int, db: Session = Depends(get_db)):
    """Return AI feedback for a specific homework submission."""
    submission = db.query(Homework_Submission).filter(Homework_Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Homework submission not found")

    feedback = db.query(AI_Feedback).filter(AI_Feedback.homework_submission_id == submission_id).all()
    if not feedback:
        raise HTTPException(status_code=404, detail="No feedback found for this submission")

    return feedback
# Request and response models
@app.post("/ml/feedback", response_model=FeedbackResponse)
def get_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """
    Provide feedback and recommended resources based on the predicted grade band and subject.
    Save the feedback in the AI_Feedback table.
    """
    try:
        # Generera feedback och resurser med FeedbackService
        feedback_data = FeedbackService.generate_feedback(
            predicted_band=request.predicted_band,
            subject=request.subject
        )

        # Spara feedback i databasen
        submission = db.query(Homework_Submission).filter(
            Homework_Submission.id == request.submission_id
        ).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        ai_feedback = AI_Feedback(
            homework_submission_id=submission.id,
            feedback_text=feedback_data["feedback_text"],
            feedback_type="AI-generated",
            improvement_suggestions="Focus on improving keyword coverage and structure.",
            model_used="tfidf_v1"
        )
        db.add(ai_feedback)
        db.commit()

        return FeedbackResponse(
            feedback_text=feedback_data["feedback_text"],
            resources=feedback_data["resources"]
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")

    return FeedbackResponse(feedback_text=feedback_text, resources=resources)
@app.get("/homework_submissions/{submission_id}/feedback", response_model=List[dict])
def get_feedback_for_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch feedback for a specific homework submission.
    """
    feedback_records = db.query(AI_Feedback).filter(
        AI_Feedback.homework_submission_id == submission_id
    ).all()

    if not feedback_records:
        raise HTTPException(status_code=404, detail="No feedback found for this submission")

    return [
        {
            "feedback_text": feedback.feedback_text,
            "feedback_type": feedback.feedback_type,
            "improvement_suggestions": feedback.improvement_suggestions,
            "created_at": feedback.created_at
        }
        for feedback in feedback_records
    ]
@app.post("/api/ml/save-feedback")
def save_feedback(request: SaveFeedbackRequest, db: Session = Depends(get_db)):
    """
    Save AI feedback to the database.
    """
    print("Received payload:", request.dict())  # Debugging log

    # Validate that the homework submission exists
    submission = db.query(Homework_Submission).filter(
        Homework_Submission.id == request.homework_submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Homework submission not found")

    # Save feedback to the AI_Feedback table
    ai_feedback = AI_Feedback(
        homework_submission_id=request.homework_submission_id,
        feedback_text=request.feedback_text,
        improvement_suggestions=request.improvement_suggestions,
        model_used=request.model_used
    )
    db.add(ai_feedback)
    db.commit()

    return {"message": "Feedback saved successfully"}
app.include_router(user_router) 
app.include_router(student_hw_router)       
                                                       
if __name__ == '__main__':
    uvicorn.run(app)