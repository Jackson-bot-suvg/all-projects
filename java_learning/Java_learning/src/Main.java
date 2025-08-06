public class Main {
    public static void main(String[] args) {
        // 定义华氏温度
        int saturdayFahrenheit = 78;
        int sundayFahrenheit = 81;

        // 调用 FahrenheitToCelsius 类中的方法
        double saturdayCelsius = FahrenheitToCelsius.convertToCelsius(saturdayFahrenheit);
        double sundayCelsius = FahrenheitToCelsius.convertToCelsius(sundayFahrenheit);

        // 输出结果
        System.out.println("Weekend Averages");
        System.out.println("Saturday: " + saturdayCelsius);
        System.out.println("Sunday: " + sundayCelsius);
    }
}
