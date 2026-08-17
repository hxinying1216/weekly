import java.sql.DriverManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CreateAdmin {
  public static void main(String[] args) throws Exception {
    var encoder = new BCryptPasswordEncoder();
    var passwordHash = encoder.encode("122816");
    try (var connection = DriverManager.getConnection("jdbc:mysql://localhost:3306/weekly_plan?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai", "root", "122816BXHRLY");
         var statement = connection.prepareStatement("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'ADMIN') ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'ADMIN'")) {
      statement.setString(1, "hxy");
      statement.setString(2, passwordHash);
      statement.executeUpdate();
    }
  }
}
