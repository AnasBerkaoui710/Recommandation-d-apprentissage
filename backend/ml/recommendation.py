from flask_mysqldb import MySQL

def get_level(score):

    if score < 40:
        return "weak"

    elif score < 70:
        return "medium"

    return "strong"


def recommend(mysql, chapter, score):

    level = get_level(score)

    cur = mysql.connection.cursor()

    cur.execute("""
        SELECT title, type, link
        FROM resources
        WHERE chapter=%s AND level=%s
    """, (chapter, level))

    results = cur.fetchall()

    recommendations = []

    for row in results:

        recommendations.append({
            "title": row[0],
            "type": row[1],
            "link": row[2]
        })

    return recommendations