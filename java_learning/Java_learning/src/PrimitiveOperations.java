public class PrimitiveOperations {
    public static void main(String[] args) {
        int intVar= 10;
        double doubleVar= 5.5;
        System.out.println("Integer value: " + intVar);
        System.out.println("Floating-point value: " + doubleVar);
        double result = intVar + doubleVar;
        System.out.println("Result of mulilication: " + result);
        double intToFloat = doubleVar;
        System.out.println("Integer cast to floating-point: " + intToFloat);
        int floatToInt = (int) doubleVar;
        System.out.println("Floating-point cast to integer: " + floatToInt);
        char letter = 'A';
        System.out.println("Original value: " + letter);
        letter = (char)(letter + 32);
        System.out.println("Lower case value: " + letter);
    }
}
