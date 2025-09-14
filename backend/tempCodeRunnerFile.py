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