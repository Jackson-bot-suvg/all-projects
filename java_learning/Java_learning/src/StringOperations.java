public class StringOperations {
    public static void main(String[] args) {
        String myname = "jackson";
        System.out.println("original name: " + myname);
        String modifiedName = "A" + myname.substring(1, myname.length()-1) + 'Z';
        System.out.println("modifiedName: " + modifiedName);
        String webAddress = "www.google.com";
        System.out.println("webAddress: " + webAddress);
        int startIndex = webAddress.indexOf("www.") + 4; // Start after "www."
        int endIndex = webAddress.lastIndexOf('.'); // Find the last dot
        String extractedName = webAddress.substring(startIndex, endIndex);
        String finalResult = extractedName + "1331";
        System.out.println("Modified web address: " + finalResult);
    }
}