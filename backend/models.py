from datetime import datetime,timezone
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Date, Table, Text, UniqueConstraint
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
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)  # ForeignKey to User table
    subject_id = Column(Integer, ForeignKey("subject.id"), nullable=True)  # Optional: Subject the teacher teaches
    qualifications = Column(Text, nullable=True)  # Teacher's qualifications
    photo = Column(String, nullable=True)
    employment_date = Column(Date, nullable=False)  # Date of employment
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    user = relationship("User", back_populates="teacher")  
    subject = relationship("Subject", backref="teacher")  # Optional: Subject table if you want to associate teachers with subjects

    subject_class_level = relationship("Subject_Class_Level", back_populates="teacher")  # Many-to-one relationship with Arskurs
    
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
    # 1) One-to-one profile link
    user = relationship("User", back_populates="student")

    # 2) Belongs to a class level
    class_level = relationship("Class_Level", back_populates="student")

    # 3) Many-to-many with Homework via the association table student_homework
    homework = relationship(
        "Homework",
        secondary="student_homework",
        back_populates="student",
        overlaps="student,homework,student_homework",  # symmetric with Homework.student
    )

    # 4) Direct access to the association rows
    student_homework = relationship(
        "Student_Homework",
        back_populates="student",
        overlaps="homework,student",  # symmetric with Student_Homework.student & Homework.student
    )

    # 5) Guardians (parent-student links)
    guardian = relationship("Guardian", back_populates="student")

class Parent(Base):
    __tablename__ = "parent"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)  # Foreign key to User table
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="parent")  # One-to-one relationship with User
    guardian = relationship("Guardian", back_populates="parent")  # Many-to-one relationship with Guardian

    
class Role(Base):
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)   
   
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="role")  # One-to-one relationship with User





class Homework(Base):
    __tablename__ = "homework"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)

    # Canonical lower-case status; keep DB default consistent with schemas
    status = Column(String, nullable=False, default="pending")
    priority = Column(String, nullable=False, default="Normal")

    # Set when status becomes 'completed'
    completed_at = Column(DateTime, nullable=True)

    # FKs
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

    # Many-to-many: Homework <-> Student via student_homework
    student = relationship(
        "Student",
        secondary="student_homework",
        back_populates="homework",
        overlaps="student_homework,homework,student"  # add "student" to silence SAWarning
    )

    # One-to-one/optional file attachment
    file_attachment = relationship(
        "File_Attachment",
        back_populates="homework",
        uselist=False
    )

    # One-to-many to the association rows
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

    # Many-to-many via subject_class_level
    # (Class_Level has the symmetric relationship above)
    class_level = relationship(
        "Class_Level",
        secondary="subject_class_level",
        back_populates="subject",
        overlaps="subject_class_level,subject,class_level"
    )

    # Subject <-> Recommended_Resource
    recommended_resource = relationship(
        "Recommended_Resource",
        back_populates="subject"
    )
class Subject_Class_Level(Base):
    __tablename__ = "subject_class_level"

    id = Column(Integer, primary_key=True, index=True)
    class_level_id = Column(Integer, ForeignKey("class_level.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subject.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teacher.id", ondelete="CASCADE"), nullable=False)

    # Optional but helpful: prevent accidental duplicate rows for the same triple
    __table_args__ = (
        UniqueConstraint("class_level_id", "subject_id", "teacher_id", name="uq_scl_class_subject_teacher"),
    )

    # Relationships
    # Using backref keeps your existing Class_Level.subject_class_level and Subject.subject_class_level
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

    # Teacher already has: subject_class_level = relationship("Subject_Class_Level", back_populates="teacher")
    teacher = relationship("Teacher", back_populates="subject_class_level")

    # Homework already has: subject_class_level = relationship("Subject_Class_Level", back_populates="homework")
    homework = relationship("Homework", back_populates="subject_class_level")
class Class_Level(Base):
    __tablename__ = "class_level"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    school_id = Column(Integer, ForeignKey("school.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # School <-> Class_Level
    school = relationship("School", back_populates="class_level")

    # Class_Level <-> Student
    student = relationship("Student", back_populates="class_level")

    # Many-to-many via subject_class_level
    # (Subject has the symmetric relationship below)
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
    submission_text = Column(Text, nullable=True)  # Text answer from student
    submission_file_id = Column(Integer, ForeignKey("file_attachment.id"), nullable=True)  # File attachment
    submission_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_late = Column(String, default="No", nullable=False)  # "Yes" or "No"
    status = Column(String, default="submitted", nullable=False)  # "submitted", "graded", "returned"
    
    # Teacher feedback and grading
    teacher_feedback = Column(Text, nullable=True)
    grade_value = Column(String, nullable=True)  # Grade given by teacher
    graded_at = Column(DateTime, nullable=True)
    graded_by_teacher_id = Column(Integer, ForeignKey("teacher.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    student_homework = relationship("Student_Homework", back_populates="homework_submission")
    submission_file = relationship("File_Attachment", foreign_keys=[submission_file_id])
    graded_by_teacher = relationship("Teacher", foreign_keys=[graded_by_teacher_id])

    # Fixed table args - ensure proper tuple syntax
    __table_args__ = (
        UniqueConstraint("student_homework_id", name="uq_homework_submission_student_homework"),
    )
class Grade(Base):
    __tablename__ = "grade"

    id = Column(Integer, primary_key=True, index=True)
    grade = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)  # New column for feedback
    created_at = Column(DateTime,  default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    student_homework_id = Column(Integer, ForeignKey("student_homework.id"))
    student_homework = relationship("Student_Homework" , back_populates="grade")    

class File_Attachment(Base):
    __tablename__ = "file_attachment"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # New column for description
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    homework = relationship("Homework", back_populates="file_attachment")  # Use back_populates
    student_homework = relationship("Student_Homework", back_populates="file_attachment")  # Use back_populates

class Message(Base):
    __tablename__ = "message"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    read_status = Column(String, default="Unread")  # New column for read_status
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    homework_id = Column(Integer, ForeignKey('homework.id'), nullable=True)
    # Add user_id as a foreign key
    recipient_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    sender_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Define separate relationships for recipient and sender
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
    subject = relationship("Subject" , back_populates="recommended_resource")  # Use back_populates


