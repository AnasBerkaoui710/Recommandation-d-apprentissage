from flask import Flask, request, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS
from config import Config
from ml.model import predict_level
from ml.recommendation import recommend

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend compatibility

app.config.from_object(Config)
mysql = MySQL(app)

# -----------------------------------
# HOME ROUTE
# -----------------------------------
@app.route("/")
def home():
    return {"message": "AI Educational Recommendation System Server is running"}

# -----------------------------------
# DATABASE TEST
# -----------------------------------
@app.route("/test-db")
def test_db():
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT 1")
        cur.close()
        return {"db": "connected"}
    except Exception as e:
        return {"db": "disconnected", "error": str(e)}, 500

# -----------------------------------
# AUTHENTICATION SYSTEM
# -----------------------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "All fields (name, email, password) are required"}), 400

    try:
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO students(name, email, password) VALUES(%s, %s, %s)",
            (name, email, password)
        )
        mysql.connection.commit()
        cur.close()
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        return jsonify({"message": "Email already exists or database error", "error": str(e)}), 400

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT id, name, email FROM students WHERE email=%s AND password=%s",
        (email, password)
    )
    user = cur.fetchone()
    cur.close()

    if user:
        return jsonify({
            "message": "Login success",
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2]
            }
        })

    return jsonify({"message": "Invalid credentials"}), 401

# -----------------------------------
# QUIZ SYSTEM
# -----------------------------------
@app.route("/quizzes")
def get_quizzes():
    cur = mysql.connection.cursor()
    cur.execute("SELECT id, title, chapter, difficulty FROM quizzes")
    data = cur.fetchall()
    cur.close()

    quizzes = []
    for row in data:
        quizzes.append({
            "id": row[0],
            "title": row[1],
            "chapter": row[2],
            "difficulty": row[3]
        })

    return jsonify(quizzes)

@app.route("/quizzes/<int:quiz_id>/questions")
def get_quiz_questions(quiz_id):
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
        FROM questions
        WHERE quiz_id = %s
    """, (quiz_id,))
    data = cur.fetchall()
    cur.close()

    questions = []
    for row in data:
        questions.append({
            "id": row[0],
            "question_text": row[1],
            "option_a": row[2],
            "option_b": row[3],
            "option_c": row[4],
            "option_d": row[5],
            "correct_option": row[6]
        })

    return jsonify(questions)

@app.route("/submit", methods=["POST"])
def submit():
    data = request.json
    student_id = data.get("student_id")
    quiz_id = data.get("quiz_id")
    score = data.get("score")
    mistakes = data.get("mistakes")

    if student_id is None or quiz_id is None or score is None or mistakes is None:
        return jsonify({"message": "Missing required fields"}), 400

    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO results(student_id, quiz_id, score, mistakes)
        VALUES(%s, %s, %s, %s)
    """, (student_id, quiz_id, score, mistakes))
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Results saved successfully"})

# -----------------------------------
# MACHINE LEARNING MODULE
# -----------------------------------
@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    score = data.get("score")
    mistakes = data.get("mistakes")

    if score is None or mistakes is None:
        return jsonify({"message": "Missing score or mistakes value"}), 400

    # Call the ML function directly instead of ml.model.predict_level
    level = predict_level(score, mistakes)

    return jsonify({"level": level})

# -----------------------------------
# RECOMMENDATION ENGINE
# -----------------------------------
@app.route("/recommend", methods=["POST"])
def recommend_route():
    data = request.json
    chapter = data.get("chapter")
    score = data.get("score")

    if not chapter or score is None:
        return jsonify({"message": "Missing chapter or score"}), 400

    recommendations = recommend(
        mysql,
        chapter,
        score
    )

    return jsonify(recommendations)

# -----------------------------------
# ANALYTICS & DASHBOARD STATS
# -----------------------------------
@app.route("/dashboard-stats/<int:student_id>")
def get_dashboard_stats(student_id):
    cur = mysql.connection.cursor()
    
    # 1. Fetch all results for this student with chapter details
    cur.execute("""
        SELECT r.score, r.mistakes, q.chapter, r.date
        FROM results r
        JOIN quizzes q ON r.quiz_id = q.id
        WHERE r.student_id = %s
        ORDER BY r.date ASC
    """, (student_id,))
    results_data = cur.fetchall()
    cur.close()
    
    if not results_data:
        return jsonify({
            "total_quizzes": 0,
            "average_score": 0,
            "average_mistakes": 0,
            "overall_level": "N/A",
            "weakest_chapter": "None",
            "history": [],
            "chapter_performance": {}
        })
        
    total_quizzes = len(results_data)
    total_score = sum(row[0] for row in results_data)
    total_mistakes = sum(row[1] for row in results_data)
    average_score = round(total_score / total_quizzes, 2)
    average_mistakes = round(total_mistakes / total_quizzes, 2)
    
    # 2. Predict overall standing level using average performance via the ML Model
    overall_level = predict_level(average_score, average_mistakes)
    
    # 3. Compile history for the line chart
    history = []
    for row in results_data:
        history.append({
            "score": row[0],
            "mistakes": row[1],
            "chapter": row[2],
            "date": row[3].strftime("%Y-%m-%d %H:%M") if row[3] else ""
        })
        
    # 4. Calculate average score per chapter to find the weakest chapter
    chapter_scores = {}
    chapter_counts = {}
    for row in results_data:
        score = row[0]
        chapter = row[2]
        chapter_scores[chapter] = chapter_scores.get(chapter, 0) + score
        chapter_counts[chapter] = chapter_counts.get(chapter, 0) + 1
        
    chapter_performance = {}
    weakest_chapter = None
    lowest_score = 101
    
    for chapter in chapter_scores:
        avg = round(chapter_scores[chapter] / chapter_counts[chapter], 2)
        chapter_performance[chapter] = avg
        if avg < lowest_score:
            lowest_score = avg
            weakest_chapter = chapter
            
    return jsonify({
        "total_quizzes": total_quizzes,
        "average_score": average_score,
        "average_mistakes": average_mistakes,
        "overall_level": overall_level,
        "weakest_chapter": weakest_chapter if weakest_chapter else "None",
        "history": history,
        "chapter_performance": chapter_performance
    })

if __name__ == "__main__":
    app.run(debug=True)