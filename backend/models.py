from datetime import datetime,timezone
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Date, Table, Text, UniqueConstraint, Numeric, Boolean
from sqlalchemy.orm import relationship
from db_setup import Base


 
class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    password = Column(String)
    phone_number = Column(String)
    role_id = Column(Integer, ForeignKey('role.id'), nullable=True)
    address = Column(Text, nullable=True)
    postal_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="user", uselist=False)
    role = relationship("Role")
    token = relationship("Token", back_populates="user", cascade="all, delete-orphan")
    teacher = relationship("Teacher", back_populates="user", uselist=False)
    parent = relationship("Parent", back_populates="user")

 
class Token(Base):
    __tablename__ = "token"

    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), primary_key=True, index=True)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Add the relationship to the User model
    user = relationship("User", back_populates="token")

 
class Student_Homework(Base):
    __tablename__ = "student_homework"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student.id", ondelete="CASCADE"))
    homework_id = Column(Integer, ForeignKey("homework.id", ondelete="CASCADE"))
    file_attachment_id = Column(Integer, ForeignKey("file_attachment.id", ondelete="CASCADE"))

    __table_args__ = (
        UniqueConstraint("student_id", "homework_id", name="uq_student_homework_student_homework"),
    )

    student = relationship("Student", back_populates="student_homework")
    homework = relationship("Homework", back_populates="student_homework")
    file_attachment = relationship("File_Attachment", back_populates="student_homework")
    grade = relationship("Grade", back_populates="student_homework")
    homework_submission = relationship("Homework_Submission", back_populates="student_homework", uselist=False)

class Guardian(Base):
    __tablename__ = "guardian"

    id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parent.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("student.id", ondelete="CASCADE"))

    parent = relationship("Parent", back_populates="guardian")
    student = relationship("Student", back_populates="guardian")


class Teacher(Base):
    __tablename__ = "teacher"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subject.id"), nullable=True)
    qualifications = Column(Text, nullable=True)
    photo = Column(String, nullable=True)
    employment_date = Column(Date, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="teacher")  
    subject = relationship("Subject", backref="teacher")

    subject_class_level = relationship("Subject_Class_Level", back_populates="teacher")
    
class School(Base):
    __tablename__ = "school"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    phone_number = Column(String(15), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    class_level = relationship("Class_Level", back_populates="school")

class Student(Base):
    __tablename__ = "student"

    id = Column(Integer, primary_key=True, index=True)
    date_of_birth = Column(Date, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    class_level_id = Column(Integer, ForeignKey("class_level.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # --- Relationships ---
    user = relationship("User", back_populates="student")
    class_level = relationship("Class_Level", back_populates="student")
    homework = relationship(
        "Homework",
        secondary="student_homework",
        back_populates="student",
        overlaps="student,homework,student_homework",
    )
    student_homework = relationship(
        "Student_Homework",
        back_populates="student",
        overlaps="homework,student",
    )
    guardian = relationship("Guardian", back_populates="student")

class Parent(Base):
    __tablename__ = "parent"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="parent")
    guardian = relationship("Guardian", back_populates="parent")

    
class Role(Base):
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)   
   
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="role")


class Homework(Base):
    __tablename__ = "homework"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)

    status = Column(String, nullable=False, default="pending")
    priority = Column(String, nullable=False, default="Normal")

    completed_at = Column(DateTime, nullable=True)

    subject_class_level_id = Column(
        Integer, ForeignKey("subject_class_level.id"), nullable=False
    )
    file_attachment_id = Column(
        Integer, ForeignKey("file_attachment.id")
    )

    # Relationships
    subject_class_level = relationship(
        "Subject_Class_Level",
        back_populates="homework",
        overlaps="subject_class_level,subject,class_level"
    )

    student = relationship(
        "Student",
        secondary="student_homework",
        back_populates="homework",
        overlaps="student_homework,homework,student"
    )

    file_attachment = relationship(
        "File_Attachment",
        back_populates="homework",
        uselist=False
    )

    student_homework = relationship(
        "Student_Homework",
        back_populates="homework",
        overlaps="homework,student"
    )

class Subject(Base):
    __tablename__ = "subject"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    class_level = relationship(
        "Class_Level",
        secondary="subject_class_level",
        back_populates="subject",
        overlaps="subject_class_level,subject,class_level"
    )

    recommended_resource = relationship(
        "Recommended_Resource",
        back_populates="subject"
    )
    
    # AI relationship
    scoring_criteria = relationship("Scoring_Criteria", back_populates="subject")

class Subject_Class_Level(Base):
    __tablename__ = "subject_class_level"

    id = Column(Integer, primary_key=True, index=True)
    class_level_id = Column(Integer, ForeignKey("class_level.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subject.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_level_id", "subject_id", "teacher_id", name="uq_scl_class_subject_teacher"),
    )

    # Relationships
    class_level = relationship(
        "Class_Level",
        backref="subject_class_level",
        overlaps="class_level,subject,subject_class_level"
    )
    subject = relationship(
        "Subject",
        backref="subject_class_level",
        overlaps="subject,class_level,subject_class_level"
    )

    teacher = relationship("Teacher", back_populates="subject_class_level")
    homework = relationship("Homework", back_populates="subject_class_level")

class Class_Level(Base):
    __tablename__ = "class_level"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    school_id = Column(Integer, ForeignKey("school.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    school = relationship("School", back_populates="class_level")
    student = relationship("Student", back_populates="class_level")
    subject = relationship(
        "Subject",
        secondary="subject_class_level",
        back_populates="class_level",
        overlaps="subject_class_level,subject,class_level"
    )

class Homework_Submission(Base):
    __tablename__ = "homework_submission"

    id = Column(Integer, primary_key=True, index=True)
    student_homework_id = Column(Integer, ForeignKey("student_homework.id", ondelete="CASCADE"), nullable=False)
    submission_text = Column(Text, nullable=True)
    submission_file_id = Column(Integer, ForeignKey("file_attachment.id"), nullable=True)
    submission_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_late = Column(String, default="No", nullable=False)
    status = Column(String, default="submitted", nullable=False)
    
    # Teacher feedback and grading
    teacher_feedback = Column(Text, nullable=True)
    grade_value = Column(String, nullable=True)
    graded_at = Column(DateTime, nullable=True)
    graded_by_teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student_homework = relationship("Student_Homework", back_populates="homework_submission")
    submission_file = relationship("File_Attachment", foreign_keys=[submission_file_id])
    graded_by_teacher = relationship("Teacher", foreign_keys=[graded_by_teacher_id])
    
    # AI relationships
    ai_scores = relationship("AI_Score", back_populates="homework_submission", cascade="all, delete-orphan")
    ai_feedback = relationship("AI_Feedback", back_populates="homework_submission", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("student_homework_id", name="uq_homework_submission_student_homework"),
    )

class Grade(Base):
    __tablename__ = "grade"

    id = Column(Integer, primary_key=True, index=True)
    grade = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime,  default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    student_homework_id = Column(Integer, ForeignKey("student_homework.id"))
    student_homework = relationship("Student_Homework" , back_populates="grade")    

class File_Attachment(Base):
    __tablename__ = "file_attachment"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    homework = relationship("Homework", back_populates="file_attachment")
    student_homework = relationship("Student_Homework", back_populates="file_attachment")

class Message(Base):
    __tablename__ = "message"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    read_status = Column(String, default="Unread")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    homework_id = Column(Integer, ForeignKey('homework.id'), nullable=True)
    recipient_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    sender_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    recipient_user = relationship("User", foreign_keys=[recipient_user_id], backref="received_messages")
    sender_user = relationship("User", foreign_keys=[sender_user_id], backref="sent_messages")

class Recommended_Resource(Base):
    __tablename__ = "recommended_resource"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    subject_id = Column(Integer, ForeignKey("subject.id"))
    subject = relationship("Subject" , back_populates="recommended_resource")

# AI Models
class AI_Score(Base):
    __tablename__ = "ai_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    homework_submission_id = Column(Integer, ForeignKey("homework_submission.id", ondelete="CASCADE"), nullable=False)
    predicted_score = Column(Numeric(5,2), nullable=True)
    confidence_level = Column(Numeric(3,2), nullable=True)
    model_used = Column(String(50), nullable=True)
    analysis_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    homework_submission = relationship("Homework_Submission", back_populates="ai_scores")

class AI_Feedback(Base):
    __tablename__ = "ai_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    homework_submission_id = Column(Integer, ForeignKey("homework_submission.id", ondelete="CASCADE"), nullable=False)
    feedback_text = Column(Text, nullable=False)
    feedback_type = Column(String(50), nullable=True)
    criteria_met = Column(Text, nullable=True)
    criteria_missed = Column(Text, nullable=True)
    improvement_suggestions = Column(Text, nullable=True)
    model_used = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    homework_submission = relationship("Homework_Submission", back_populates="ai_feedback")

class Scoring_Criteria(Base):
    __tablename__ = "scoring_criteria"
    
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subject.id", ondelete="SET NULL"), nullable=True)
    homework_type = Column(String(100), nullable=True)
    criteria_name = Column(String(200), nullable=False)
    criteria_description = Column(Text, nullable=True)
    max_points = Column(Integer, default=100)
    keywords = Column(Text, nullable=True)
    weight = Column(Numeric(3,2), default=1.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    subject = relationship("Subject", back_populates="scoring_criteria")

class AI_Model_Metrics(Base):
    __tablename__ = "ai_model_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    accuracy_score = Column(Numeric(5,4), nullable=True)
    total_predictions = Column(Integer, default=0)
    correct_predictions = Column(Integer, default=0)
    teacher_overrides = Column(Integer, default=0)
    last_trained = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))