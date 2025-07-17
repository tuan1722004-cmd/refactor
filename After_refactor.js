// --- Refactored: PersonalTaskManager ---
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.json.simple.JSONArray;r
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

public class PersonalTaskManagerRefactored {

    private static final String DB_FILE_PATH = "tasks_database.json";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ENUM PriorityLevel
    enum PriorityLevel {
        THAP("Thấp"), TRUNG_BINH("Trung bình"), CAO("Cao");

        private final String label;
        PriorityLevel(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }

        public static PriorityLevel fromLabel(String label) {
            for (PriorityLevel level : values()) {
                if (level.label.equalsIgnoreCase(label)) return level;
            }
            throw new IllegalArgumentException("Lỗi: Mức độ ưu tiên không hợp lệ. Vui lòng chọn từ: Thấp, Trung bình, Cao.");
        }
    }

    // Validator methods
    private static void validateTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Lỗi: Tiêu đề không được để trống.");
        }
    }

    private static LocalDate parseDueDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Lỗi: Ngày đến hạn không được để trống.");
        }
        try {
            return LocalDate.parse(dateStr, DATE_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Lỗi: Ngày đến hạn không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD.");
        }
    }

    private static JSONArray loadTasksFromDb() {
        try (FileReader reader = new FileReader(DB_FILE_PATH)) {
            Object obj = new JSONParser().parse(reader);
            return (obj instanceof JSONArray) ? (JSONArray) obj : new JSONArray();
        } catch (IOException | ParseException e) {
            return new JSONArray();
        }
    }

    private static void saveTasksToDb(JSONArray tasks) {
        try (FileWriter writer = new FileWriter(DB_FILE_PATH)) {
            writer.write(tasks.toJSONString());
            writer.flush();
        } catch (IOException e) {
            System.err.println("Lỗi khi ghi vào file database: " + e.getMessage());
        }
    }

    private static boolean isDuplicateTask(JSONArray tasks, String title, LocalDate dueDate) {
        for (Object obj : tasks) {
            JSONObject task = (JSONObject) obj;
            if (task.get("title").toString().equalsIgnoreCase(title) &&
                task.get("due_date").toString().equals(dueDate.format(DATE_FORMATTER))) {
                return true;
            }
        }
        return false;
    }

    public JSONObject addNewTask(String title, String description, String dueDateStr, String priorityLabel) {
        try {
            validateTitle(title);
            LocalDate dueDate = parseDueDate(dueDateStr);
            PriorityLevel priority = PriorityLevel.fromLabel(priorityLabel);

            JSONArray tasks = loadTasksFromDb();
            if (isDuplicateTask(tasks, title, dueDate)) {
                throw new IllegalArgumentException("Lỗi: Nhiệm vụ '" + title + "' đã tồn tại với cùng ngày đến hạn.");
            }

            JSONObject newTask = new JSONObject();
            newTask.put("id", UUID.randomUUID().toString());
            newTask.put("title", title);
            newTask.put("description", description);
            newTask.put("due_date", dueDate.format(DATE_FORMATTER));
            newTask.put("priority", priority.getLabel());
            newTask.put("status", "Chưa hoàn thành");
            String now = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
            newTask.put("created_at", now);
            newTask.put("last_updated_at", now);

            tasks.add(newTask);
            saveTasksToDb(tasks);

            System.out.println(" Đã thêm nhiệm vụ mới thành công: " + newTask.get("title"));
            return newTask;

        } catch (IllegalArgumentException e) {
            System.err.println(e.getMessage());
            return null;
        }
    }

    public static void main(String[] args) {
        PersonalTaskManagerRefactored manager = new PersonalTaskManagerRefactored();

        System.out.println("\n Thêm nhiệm vụ hợp lệ:");
        manager.addNewTask("Mua sách", "Sách Công nghệ phần mềm.", "2025-07-20", "Cao");

        System.out.println("\n Thêm nhiệm vụ trùng lặp:");
        manager.addNewTask("Mua sách", "Sách Công nghệ phần mềm.", "2025-07-20", "Cao");

        System.out.println("\n Thêm nhiệm vụ sai định dạng ngày:");
        manager.addNewTask("Học Java", "Tài liệu cơ bản.", "20-07-2025", "Trung bình");

        System.out.println("\n Thêm nhiệm vụ thiếu tiêu đề:");
        manager.addNewTask("", "Thiếu tiêu đề.", "2025-07-21", "Thấp");

        System.out.println("\n Thêm nhiệm vụ sai mức ưu tiên:");
        manager.addNewTask("Dọn dẹp", "Tổng vệ sinh.", "2025-07-22", "Khẩn cấp");
    }
}
