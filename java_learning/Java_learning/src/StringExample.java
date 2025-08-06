public class StringExample {
    public static void main(String[] args) {
        // 使用 new 关键字
        String str1 = new String("Computer Science");
        String str2 = new String("Computer Science");

        // 直接赋值
        String str3 = "Computer Science";
        String str4 = "Computer Science";

        // 比较引用
        System.out.println(str1 == str2); // false（堆中是两个不同对象）
        System.out.println(str3 == str4); // true（字符串池中是同一个对象）

        // 比较内容
        System.out.println(str1.equals(str2)); // true（内容相同）
    }
}