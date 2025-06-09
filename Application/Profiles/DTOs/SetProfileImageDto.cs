namespace Application.Profiles.DTOs;

public class SetProfileImageDto
{
    public required string MediaUrl { get; set; }
    public required string PublicId { get; set; }

    /** 
    * "profile" - for profile picture
    * "banner"  - for banner image
    */
    public required string ImageType { get; set; }
}
