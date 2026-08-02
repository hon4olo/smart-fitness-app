import { Image, View } from "react-native";

import type { SocialMediaPublicDescriptorDto } from "@/api/social";

import type { SocialWorkoutPostSurfaceStyles } from "./screens/SocialWorkoutPostSurface.styles";

type SocialWorkoutPostImageProps = {
  descriptor: SocialMediaPublicDescriptorDto;
  styles: SocialWorkoutPostSurfaceStyles;
};

export function SocialWorkoutPostImage({
  descriptor,
  styles,
}: SocialWorkoutPostImageProps) {
  if (descriptor.assetType !== "workout_post_image") return null;
  const variant =
    descriptor.variants.post_1080 ??
    descriptor.variants.post_640 ??
    descriptor.variants.post_320;
  if (!variant) return null;
  const backgroundColor =
    descriptor.placeholder.type === "average_color"
      ? descriptor.placeholder.value
      : undefined;

  return (
    <View
      style={[
        styles.postImageFrame,
        { aspectRatio: descriptor.aspectRatio, backgroundColor },
      ]}>
      <Image
        resizeMode="cover"
        source={{ uri: variant.url }}
        style={styles.postImage}
      />
    </View>
  );
}
