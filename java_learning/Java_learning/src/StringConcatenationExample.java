public class StringConcatenationExample {
    public static void main(String[] args) {
        System.out.println("Result 1: " + ("13" + 31)); // "1331"
        System.out.println("Result 2: " + ("1331" + '1')); // "13311"
        System.out.println("Result 3: " + (13.3 + "1")); // "13.31"
        System.out.println("Result 4: " + (false + "")); // "false"
        System.out.println("Result 5: " + ("" + true)); // "true"
        System.out.println("Result 6: " + (1331 + "")); // "1331"
        System.out.println("Result 7: " + ("" + 'A')); // "A"
    }
}