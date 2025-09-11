from datetime import datetime, timezone
from typing import List
from fastapi import FastAPI, HTTPException, Depends, Security

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import update
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session
from db_setup import get_db, create_databases
from models import  Message, User, Token
from auth import create_database_token, generate_token, get_current_user, get_password_hash, token_expiry
from passlib.context import CryptContext
from db_setup import get_db
import crud
import uvicorn
from schemas import RoleBase ,MessageBase,MessageCreate,MessageUpdate, SubjectClassLevelOut
from schemas import UserBase, UserIn, UserOut,GetUser, UpdateUser,RoleBase, RoleOut,RoleCreate,RoleUpdate,SchoolBase
from models import Recommended_Resource,Student_Homework
from models import  User,Homework,Subject_Class_Level,Grade,Student_Homework,File_Attachment
from models import Role ,School, Teacher, Student, Parent,Class_Level,Token,Subject,Guardian
from schemas import UserOut,SchoolBase,SchoolCreate,SchoolUpdate,ClassLevelBase
from schemas import ClassLevelCreate,ClassLevelUpdate,SubjectBase,SubjectUpdate,SubjectCreate
from schemas import StudentBase,StudentCreate,StudentUpdate,StudentOut,TeacherUpdate,TeacherCreate,TeacherBase
from schemas import ParentBase,ParentCreate,ParentUpdate,ParentOut,StudentHomeworkBase,StudentHomeworkUpdate,StudentHomeworkCreate
from schemas import GuardianCreate,GuardianUpdate,GuardianOut,HomeworkCreate,HomeworkUpdate,HomeworkOut,HomeworkCreate
from schemas import SubjectClassLevelBase,SubjectClassLevelCreate,SubjectClassLevelUpdate,StudentHomeworkBase
from schemas import GradeBase,GradeCreate,GradeUpdate,StudentHomeworkCreate,StudentHomeworkUpdate,TeacherOut,StudentHomeworkOut
from schemas import FileAttachmentBase,FileAttachmentCreate,FileAttachmentUpdate,RecommendedResourceBase,RecommendedResourceCreate,RecommendedResourceUpdate
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
        CORSMiddleware,  # type: ignore
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )
create_databases()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)




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
@app.get("/users/", response_model=List[UserOut])
def read_users(current_user: User = Depends(get_current_user),
    database: Session = Depends(get_db)):
    """
     Hämtar alla användare från databasen.
    """
    users = database.query(User).all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    return users
@app.get("/user-profile")
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
@app.get("/users/{user_id}", response_model=UserOut)
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

@app.post("/users/", response_model=UserOut)
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
    
@app.post("/get_user_by_email_and_password")
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
@app.delete("/users/{user_id}")
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
@app.put("/users/{user_id}", response_model=UserBase)
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
    return roles

@app.get("/roles", response_model=List[RoleBase])
def add_role(role_data: RoleCreate, 
             current_user: User = Depends(get_current_user),  # Validate token and authenticate user
             database: Session = Depends(get_db)):
    """
    Add a new role to the database.
    """
    # Check if the role already exists
    existing_role = database.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(status_code=400, detail="Role already exists")

    # Create the new role
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

# Create a new student
@app.post("/students", response_model=StudentBase)
def create_student(student: StudentCreate, current_user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    """
    Create a new student.
    """
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
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    database: Session = Depends(get_db)
):
    """
    Get all students from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all students from the database
    students = database.query(Student).options(joinedload(Student.user)).all()
  
    # Return the list of students
    return students

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
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    
    """
    Add a new homework to the database.
    """
    # Ensure the subject_class_level exists
    subject_class_level = db.query(Subject_Class_Level).filter(Subject_Class_Level.id == homework_data.subject_class_level_id).first()
    if not subject_class_level:
        raise HTTPException(status_code=404, detail="Subject class level not found")

    # Create the new homework
    new_homework = Homework(
        title=homework_data.title,
        description=homework_data.description,
        due_date=homework_data.due_date,
        priority=homework_data.priority,
        status=homework_data.status,
        subject_class_level_id=homework_data.subject_class_level_id,
    )
    db.add(new_homework)
    db.commit()
    db.refresh(new_homework)

    return new_homework
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
@app.post("/grades", response_model=GradeBase)
def add_grade(
    grade_data: GradeCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new grade to the database.
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

    return new_grade
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
@app.post("/student_homeworks", response_model=StudentHomeworkBase)
def add_student_homework(
    student_homework_data: StudentHomeworkCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new Student_Homework to the database.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to add student homework")

    # Ensure the student and homework exist
    student = db.query(Student).filter(Student.id == student_homework_data.student_id).first()
    homework = db.query(Homework).filter(Homework.id == student_homework_data.homework_id).first()

    if not student or not homework:
        raise HTTPException(status_code=404, detail="Student or Homework not found")

    # Create the new Student_Homework
    new_student_homework = Student_Homework(
        student_id=student_homework_data.student_id,
        homework_id=student_homework_data.homework_id,
        file_attachement_id=student_homework_data.file_attachement_id
    )
    db.add(new_student_homework)
    db.commit()
    db.refresh(new_student_homework)

    return new_student_homework  
@app.get("/student_homeworks", response_model=List[StudentHomeworkOut])
def get_all_student_homeworks(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all Student_Homework entries from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all Student_Homework entries with related homework data
    student_homeworks = db.query(Student_Homework).options(
        joinedload(Student_Homework.homework),  # Load the related homework data
        joinedload(Student_Homework.student).joinedload(Student.user)  # Load student and user data
    ).all()

    return student_homeworks
@app.put("/student_homeworks/{student_homework_id}", response_model=StudentHomeworkBase)
def update_student_homework(
    student_homework_id: int,
    student_homework_update: StudentHomeworkUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a Student_Homework by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to update student homework")

    # Fetch the Student_Homework entry
    student_homework = db.query(Student_Homework).filter(Student_Homework.id == student_homework_id).first()
    if not student_homework:
        raise HTTPException(status_code=404, detail="Student_Homework not found")

    # Update the fields
    if student_homework_update.student_id:
        student_homework.student_id = student_homework_update.student_id
    if student_homework_update.homework_id:
        student_homework.homework_id = student_homework_update.homework_id
    if student_homework_update.file_attachement_id:
        student_homework.file_attachement_id = student_homework_update.file_attachement_id

    db.commit()
    db.refresh(student_homework)

    return student_homework   
@app.delete("/student_homeworks/{student_homework_id}")
def delete_student_homework(
    student_homework_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a Student_Homework by ID.
    """
    # Ensure the user has the necessary permissions (e.g., teacher)
    if current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Not authorized to delete student homework")

    # Fetch the Student_Homework entry
    student_homework = db.query(Student_Homework).filter(Student_Homework.id == student_homework_id).first()
    if not student_homework:
        raise HTTPException(status_code=404, detail="Student_Homework not found")

    # Delete the entry
    db.delete(student_homework)
    db.commit()

    return {"message": f"Student_Homework with ID {student_homework_id} has been deleted successfully"}   
@app.post("/messages", response_model=MessageBase)
def add_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Add a new message to the database.
    """
    # Ensure the recipient exists
    recipient = db.query(User).filter(User.id == message_data.recipient_user_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    # Create the new message
    new_message = Message(
        message=message_data.message,
        read_status="Unread",
        recipient_user_id=message_data.recipient_user_id,
        sender_user_id=current_user.id
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return new_message  
@app.get("/messages", response_model=List[MessageBase])
def get_all_messages(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all messages for the current user.
    """
    # Fetch all messages where the current user is the recipient
    messages = db.query(Message).filter(Message.recipient_user_id == current_user.id).all()

    return messages  
@app.put("/messages/{message_id}", response_model=MessageBase)
def update_message(
    message_id: int,
    message_update: MessageUpdate,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Update a message by ID (e.g., mark as read).
    """
    # Fetch the message
    message = db.query(Message).filter(Message.id == message_id, Message.recipient_user_id == current_user.id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not authorized to update")

    # Update the read_status
    if message_update.read_status:
        message.read_status = message_update.read_status

    db.commit()
    db.refresh(message)

    return message  
@app.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Delete a message by ID.
    """
    # Fetch the message
    message = db.query(Message).filter(Message.id == message_id, Message.recipient_user_id == current_user.id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found or not authorized to delete")

    # Delete the message
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
@app.get("/file_attachments", response_model=List[FileAttachmentBase])
def get_all_file_attachments(
    current_user: User = Depends(get_current_user),  # Token validation and user authentication
    db: Session = Depends(get_db)
):
    """
    Get all File_Attachment entries from the database.
    """
    # Ensure the user is authenticated
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Fetch all File_Attachment entries
    file_attachments = db.query(File_Attachment).all()

    return file_attachments  
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
                                                             
if __name__ == '__main__':
    uvicorn.run(app)