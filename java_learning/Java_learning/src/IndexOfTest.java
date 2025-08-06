public class IndexOfTest{
    public static void main(String[] args){
        String funnyStr = "jackson! is! so! fucking! handsome!";
        int a = funnyStr.indexOf(33);
        int b = funnyStr.indexOf('!');
        int c = funnyStr.indexOf("!");
        int d = funnyStr.indexOf("! so");
        System.out.println(a);
        System.out.println(b);
        System.out.println(c);
        System.out.println(d);
    }
}