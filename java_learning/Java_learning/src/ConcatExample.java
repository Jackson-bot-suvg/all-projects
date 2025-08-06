public class ConcatExample {
    public static void main(String[] args) {
        String major = "Computer Science";
        String interest = "long walks on the beach";

        // Concatenating strings / 字符串拼接
        String result = major.concat(interest);

        // Printing results / 打印结果
        System.out.println("Original major: " + major); // 输出: Computer Science
        System.out.println("Original interest: " + interest); // 输出: long walks on the beach
        System.out.println("Result: " + result); // 输出: Computer Sciencelong walks on the beach
    }
}