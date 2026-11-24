// src/foundation/exporter/Gltf2ExporterEffekseer.ts
import { WellKnownComponentTIDs } from "../components/WellKnownComponentTIDs.js";
import { Is } from "../misc/Is.js";
import { Logger } from "../misc/Logger.js";
import { createAndAddGltf2BufferView } from "./Gltf2ExporterOps.js";
function createEffekseer(json, entities) {
  let effekseerExists = false;
  const bufferIdx = json.extras.bufferViewByteLengthAccumulatedArray.length - 1;
  const effects = [];
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const effekseerComponent = entity.getComponentByComponentTID(
      WellKnownComponentTIDs.EffekseerComponentTID
    );
    if (Is.exist(effekseerComponent)) {
      effekseerExists = true;
      const effekseer = {
        node: i,
        name: effekseerComponent.uniqueName
      };
      if (Is.exist(effekseerComponent.arrayBuffer)) {
        const gltf2BufferView = createAndAddGltf2BufferView(
          json,
          bufferIdx,
          new Uint8Array(effekseerComponent.arrayBuffer)
        );
        effekseer.bufferView = json.bufferViews.indexOf(gltf2BufferView);
      } else if (Is.exist(effekseerComponent.uri)) {
        effekseer.uri = effekseerComponent.uri;
      } else {
        Logger.default.error("no real effect data.");
      }
      __createEffekseerTimeline(effekseerComponent.entity, effekseer);
      effects.push(effekseer);
    }
  }
  if (effekseerExists) {
    json.extensions.RHODONITE_effekseer = {
      version: "1.0",
      effects
    };
    json.extensionsUsed.push("RHODONITE_effekseer");
  }
}
function __createEffekseerTimeline(entity, effekseer) {
  const animationComponent = entity.tryToGetAnimation();
  if (Is.exist(animationComponent)) {
    const trackNames = animationComponent.getAnimationTrackNames();
    const timelines = [];
    for (const trackName of trackNames) {
      if (animationComponent.hasAnimation(trackName, "effekseer")) {
        const rnAnimationTrack = animationComponent.getAnimationChannelsOfTrack();
        if (Is.exist(rnAnimationTrack)) {
          const rnChannels = rnAnimationTrack.values();
          for (const rnChannel of rnChannels) {
            const pathName = rnChannel.target.pathName;
            if (pathName === "effekseer") {
              const animatedValue = rnChannel.animatedValue;
              for (const trackName2 of animatedValue.getAllTrackNames()) {
                const inputArray = animatedValue.getAnimationSampler(trackName2).input;
                const values = [];
                for (let i = 0; i < inputArray.length; i++) {
                  const input = inputArray[i];
                  const output = animatedValue.getAnimationSampler(trackName2).output[i];
                  const timelineItem = {
                    input,
                    event: output > 0.5 ? "play" : "pause"
                  };
                  values.push(timelineItem);
                }
                const timeline = {
                  name: trackName2,
                  values
                };
                timelines.push(timeline);
              }
            }
          }
        }
      }
    }
    effekseer.timelines = timelines;
  }
}
export {
  createEffekseer
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZXhwb3J0ZXIvR2x0ZjJFeHBvcnRlckVmZmVrc2Vlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBFZmZla3NlZXJDb21wb25lbnQgfSBmcm9tICcuLi8uLi9lZmZla3NlZXIvRWZmZWtzZWVyQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgR2x0ZjJFeCB9IGZyb20gJy4uLy4uL3R5cGVzL2dsVEYyRm9yT3V0cHV0JztcbmltcG9ydCB0eXBlIHtcbiAgUm5NMkV4dGVuc2lvbkVmZmVrc2VlcixcbiAgUm5NMkV4dGVuc2lvbnNFZmZla3NlZXJFZmZlY3QsXG4gIFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyVGltZWxpbmUsXG4gIFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyVGltZWxpbmVJdGVtLFxufSBmcm9tICcuLi8uLi90eXBlcy9Sbk0yJztcbmltcG9ydCB7IFdlbGxLbm93bkNvbXBvbmVudFRJRHMgfSBmcm9tICcuLi9jb21wb25lbnRzL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuaW1wb3J0IHR5cGUgeyBJRW50aXR5IH0gZnJvbSAnLi4vY29yZSc7XG5pbXBvcnQgdHlwZSB7IElTY2VuZUdyYXBoRW50aXR5IH0gZnJvbSAnLi4vaGVscGVycy9FbnRpdHlIZWxwZXInO1xuaW1wb3J0IHsgSXMgfSBmcm9tICcuLi9taXNjL0lzJztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJy4uL21pc2MvTG9nZ2VyJztcbmltcG9ydCB7IGNyZWF0ZUFuZEFkZEdsdGYyQnVmZmVyVmlldyB9IGZyb20gJy4vR2x0ZjJFeHBvcnRlck9wcyc7XG5cbi8qKlxuICogQ3JlYXRlcyBhbmQgYWRkcyBFZmZla3NlZXIgZXh0ZW5zaW9uIGRhdGEgdG8gdGhlIGdsVEYgMi4wIGV4cG9ydCBKU09OLlxuICogVGhpcyBmdW5jdGlvbiBwcm9jZXNzZXMgYWxsIGVudGl0aWVzIHdpdGggRWZmZWtzZWVyIGNvbXBvbmVudHMgYW5kIGV4cG9ydHMgdGhlaXJcbiAqIGVmZmVjdCBkYXRhLCBpbmNsdWRpbmcgYnVmZmVyIHZpZXdzIGZvciBlZmZlY3QgZmlsZXMgYW5kIGFuaW1hdGlvbiB0aW1lbGluZXMuXG4gKlxuICogQHBhcmFtIGpzb24gLSBUaGUgZ2xURiAyLjAgZXhwb3J0IEpTT04gb2JqZWN0IHRvIG1vZGlmeVxuICogQHBhcmFtIGVudGl0aWVzIC0gQXJyYXkgb2Ygc2NlbmUgZ3JhcGggZW50aXRpZXMgdG8gcHJvY2VzcyBmb3IgRWZmZWtzZWVyIGNvbXBvbmVudHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVmZmVrc2Vlcihqc29uOiBHbHRmMkV4LCBlbnRpdGllczogSVNjZW5lR3JhcGhFbnRpdHlbXSkge1xuICBsZXQgZWZmZWtzZWVyRXhpc3RzID0gZmFsc2U7XG4gIGNvbnN0IGJ1ZmZlcklkeCA9IGpzb24uZXh0cmFzLmJ1ZmZlclZpZXdCeXRlTGVuZ3RoQWNjdW11bGF0ZWRBcnJheS5sZW5ndGggLSAxO1xuICBjb25zdCBlZmZlY3RzOiBSbk0yRXh0ZW5zaW9uc0VmZmVrc2VlckVmZmVjdFtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBlbnRpdHkgPSBlbnRpdGllc1tpXTtcbiAgICBjb25zdCBlZmZla3NlZXJDb21wb25lbnQgPSBlbnRpdHkuZ2V0Q29tcG9uZW50QnlDb21wb25lbnRUSUQoXG4gICAgICBXZWxsS25vd25Db21wb25lbnRUSURzLkVmZmVrc2VlckNvbXBvbmVudFRJRFxuICAgICkgYXMgRWZmZWtzZWVyQ29tcG9uZW50O1xuICAgIGlmIChJcy5leGlzdChlZmZla3NlZXJDb21wb25lbnQpKSB7XG4gICAgICBlZmZla3NlZXJFeGlzdHMgPSB0cnVlO1xuXG4gICAgICBjb25zdCBlZmZla3NlZXI6IFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyRWZmZWN0ID0ge1xuICAgICAgICBub2RlOiBpLFxuICAgICAgICBuYW1lOiBlZmZla3NlZXJDb21wb25lbnQudW5pcXVlTmFtZSxcbiAgICAgIH07XG5cbiAgICAgIGlmIChJcy5leGlzdChlZmZla3NlZXJDb21wb25lbnQuYXJyYXlCdWZmZXIpKSB7XG4gICAgICAgIGNvbnN0IGdsdGYyQnVmZmVyVmlldyA9IGNyZWF0ZUFuZEFkZEdsdGYyQnVmZmVyVmlldyhcbiAgICAgICAgICBqc29uLFxuICAgICAgICAgIGJ1ZmZlcklkeCxcbiAgICAgICAgICBuZXcgVWludDhBcnJheShlZmZla3NlZXJDb21wb25lbnQuYXJyYXlCdWZmZXIpXG4gICAgICAgICk7XG4gICAgICAgIGVmZmVrc2Vlci5idWZmZXJWaWV3ID0ganNvbi5idWZmZXJWaWV3cy5pbmRleE9mKGdsdGYyQnVmZmVyVmlldyk7XG4gICAgICB9IGVsc2UgaWYgKElzLmV4aXN0KGVmZmVrc2VlckNvbXBvbmVudC51cmkpKSB7XG4gICAgICAgIGVmZmVrc2Vlci51cmkgPSBlZmZla3NlZXJDb21wb25lbnQudXJpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ25vIHJlYWwgZWZmZWN0IGRhdGEuJyk7XG4gICAgICB9XG5cbiAgICAgIF9fY3JlYXRlRWZmZWtzZWVyVGltZWxpbmUoZWZmZWtzZWVyQ29tcG9uZW50LmVudGl0eSwgZWZmZWtzZWVyKTtcblxuICAgICAgZWZmZWN0cy5wdXNoKGVmZmVrc2Vlcik7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVmZmVrc2VlckV4aXN0cykge1xuICAgIGpzb24uZXh0ZW5zaW9ucyEuUkhPRE9OSVRFX2VmZmVrc2VlciA9IHtcbiAgICAgIHZlcnNpb246ICcxLjAnLFxuICAgICAgZWZmZWN0czogZWZmZWN0cyxcbiAgICB9IGFzIFJuTTJFeHRlbnNpb25FZmZla3NlZXI7XG4gICAganNvbi5leHRlbnNpb25zVXNlZCEucHVzaCgnUkhPRE9OSVRFX2VmZmVrc2VlcicpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbmltYXRpb24gdGltZWxpbmUgZGF0YSBmb3IgRWZmZWtzZWVyIGVmZmVjdHMgZnJvbSBlbnRpdHkgYW5pbWF0aW9uIGNvbXBvbmVudHMuXG4gKiBUaGlzIGZ1bmN0aW9uIGV4dHJhY3RzIGFuaW1hdGlvbiB0cmFja3MgdGhhdCBjb250cm9sIEVmZmVrc2VlciBwbGF5YmFjayBzdGF0ZSBhbmRcbiAqIGNvbnZlcnRzIHRoZW0gaW50byB0aW1lbGluZSBmb3JtYXQgZm9yIHRoZSBnbFRGIGV4dGVuc2lvbi5cbiAqXG4gKiBAcGFyYW0gZW50aXR5IC0gVGhlIGVudGl0eSBjb250YWluaW5nIGFuaW1hdGlvbiBkYXRhXG4gKiBAcGFyYW0gZWZmZWtzZWVyIC0gVGhlIEVmZmVrc2VlciBlZmZlY3Qgb2JqZWN0IHRvIGFkZCB0aW1lbGluZSBkYXRhIHRvXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBfX2NyZWF0ZUVmZmVrc2VlclRpbWVsaW5lKGVudGl0eTogSUVudGl0eSwgZWZmZWtzZWVyOiBSbk0yRXh0ZW5zaW9uc0VmZmVrc2VlckVmZmVjdCkge1xuICBjb25zdCBhbmltYXRpb25Db21wb25lbnQgPSBlbnRpdHkudHJ5VG9HZXRBbmltYXRpb24oKTtcbiAgaWYgKElzLmV4aXN0KGFuaW1hdGlvbkNvbXBvbmVudCkpIHtcbiAgICBjb25zdCB0cmFja05hbWVzID0gYW5pbWF0aW9uQ29tcG9uZW50LmdldEFuaW1hdGlvblRyYWNrTmFtZXMoKTtcbiAgICBjb25zdCB0aW1lbGluZXM6IFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyVGltZWxpbmVbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgdHJhY2tOYW1lIG9mIHRyYWNrTmFtZXMpIHtcbiAgICAgIGlmIChhbmltYXRpb25Db21wb25lbnQuaGFzQW5pbWF0aW9uKHRyYWNrTmFtZSwgJ2VmZmVrc2VlcicpKSB7XG4gICAgICAgIGNvbnN0IHJuQW5pbWF0aW9uVHJhY2sgPSBhbmltYXRpb25Db21wb25lbnQuZ2V0QW5pbWF0aW9uQ2hhbm5lbHNPZlRyYWNrKCk7XG4gICAgICAgIGlmIChJcy5leGlzdChybkFuaW1hdGlvblRyYWNrKSkge1xuICAgICAgICAgIGNvbnN0IHJuQ2hhbm5lbHMgPSBybkFuaW1hdGlvblRyYWNrLnZhbHVlcygpO1xuICAgICAgICAgIGZvciAoY29uc3Qgcm5DaGFubmVsIG9mIHJuQ2hhbm5lbHMpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhdGhOYW1lID0gcm5DaGFubmVsLnRhcmdldC5wYXRoTmFtZTtcbiAgICAgICAgICAgIGlmIChwYXRoTmFtZSA9PT0gJ2VmZmVrc2VlcicpIHtcbiAgICAgICAgICAgICAgY29uc3QgYW5pbWF0ZWRWYWx1ZSA9IHJuQ2hhbm5lbC5hbmltYXRlZFZhbHVlO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRyYWNrTmFtZSBvZiBhbmltYXRlZFZhbHVlLmdldEFsbFRyYWNrTmFtZXMoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0QXJyYXkgPSBhbmltYXRlZFZhbHVlLmdldEFuaW1hdGlvblNhbXBsZXIodHJhY2tOYW1lKS5pbnB1dDtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXM6IFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyVGltZWxpbmVJdGVtW10gPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0QXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gaW5wdXRBcnJheVtpXTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGFuaW1hdGVkVmFsdWUuZ2V0QW5pbWF0aW9uU2FtcGxlcih0cmFja05hbWUpLm91dHB1dFtpXTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRpbWVsaW5lSXRlbTogUm5NMkV4dGVuc2lvbnNFZmZla3NlZXJUaW1lbGluZUl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0OiBpbnB1dCxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IG91dHB1dCA+IDAuNSA/ICdwbGF5JyA6ICdwYXVzZScsXG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2godGltZWxpbmVJdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdGltZWxpbmU6IFJuTTJFeHRlbnNpb25zRWZmZWtzZWVyVGltZWxpbmUgPSB7XG4gICAgICAgICAgICAgICAgICBuYW1lOiB0cmFja05hbWUsXG4gICAgICAgICAgICAgICAgICB2YWx1ZXM6IHZhbHVlcyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRpbWVsaW5lcy5wdXNoKHRpbWVsaW5lKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBlZmZla3NlZXIudGltZWxpbmVzID0gdGltZWxpbmVzO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBUUEsU0FBUyw4QkFBOEI7QUFHdkMsU0FBUyxVQUFVO0FBQ25CLFNBQVMsY0FBYztBQUN2QixTQUFTLG1DQUFtQztBQVVyQyxTQUFTLGdCQUFnQixNQUFlLFVBQStCO0FBQzVFLE1BQUksa0JBQWtCO0FBQ3RCLFFBQU0sWUFBWSxLQUFLLE9BQU8scUNBQXFDLFNBQVM7QUFDNUUsUUFBTSxVQUEyQyxDQUFDO0FBQ2xELFdBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxRQUFRLEtBQUs7QUFDeEMsVUFBTSxTQUFTLFNBQVMsQ0FBQztBQUN6QixVQUFNLHFCQUFxQixPQUFPO0FBQUEsTUFDaEMsdUJBQXVCO0FBQUEsSUFDekI7QUFDQSxRQUFJLEdBQUcsTUFBTSxrQkFBa0IsR0FBRztBQUNoQyx3QkFBa0I7QUFFbEIsWUFBTSxZQUEyQztBQUFBLFFBQy9DLE1BQU07QUFBQSxRQUNOLE1BQU0sbUJBQW1CO0FBQUEsTUFDM0I7QUFFQSxVQUFJLEdBQUcsTUFBTSxtQkFBbUIsV0FBVyxHQUFHO0FBQzVDLGNBQU0sa0JBQWtCO0FBQUEsVUFDdEI7QUFBQSxVQUNBO0FBQUEsVUFDQSxJQUFJLFdBQVcsbUJBQW1CLFdBQVc7QUFBQSxRQUMvQztBQUNBLGtCQUFVLGFBQWEsS0FBSyxZQUFZLFFBQVEsZUFBZTtBQUFBLE1BQ2pFLFdBQVcsR0FBRyxNQUFNLG1CQUFtQixHQUFHLEdBQUc7QUFDM0Msa0JBQVUsTUFBTSxtQkFBbUI7QUFBQSxNQUNyQyxPQUFPO0FBQ0wsZUFBTyxRQUFRLE1BQU0sc0JBQXNCO0FBQUEsTUFDN0M7QUFFQSxnQ0FBMEIsbUJBQW1CLFFBQVEsU0FBUztBQUU5RCxjQUFRLEtBQUssU0FBUztBQUFBLElBQ3hCO0FBQUEsRUFDRjtBQUVBLE1BQUksaUJBQWlCO0FBQ25CLFNBQUssV0FBWSxzQkFBc0I7QUFBQSxNQUNyQyxTQUFTO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxTQUFLLGVBQWdCLEtBQUsscUJBQXFCO0FBQUEsRUFDakQ7QUFDRjtBQVdBLFNBQVMsMEJBQTBCLFFBQWlCLFdBQTBDO0FBQzVGLFFBQU0scUJBQXFCLE9BQU8sa0JBQWtCO0FBQ3BELE1BQUksR0FBRyxNQUFNLGtCQUFrQixHQUFHO0FBQ2hDLFVBQU0sYUFBYSxtQkFBbUIsdUJBQXVCO0FBQzdELFVBQU0sWUFBK0MsQ0FBQztBQUN0RCxlQUFXLGFBQWEsWUFBWTtBQUNsQyxVQUFJLG1CQUFtQixhQUFhLFdBQVcsV0FBVyxHQUFHO0FBQzNELGNBQU0sbUJBQW1CLG1CQUFtQiw0QkFBNEI7QUFDeEUsWUFBSSxHQUFHLE1BQU0sZ0JBQWdCLEdBQUc7QUFDOUIsZ0JBQU0sYUFBYSxpQkFBaUIsT0FBTztBQUMzQyxxQkFBVyxhQUFhLFlBQVk7QUFDbEMsa0JBQU0sV0FBVyxVQUFVLE9BQU87QUFDbEMsZ0JBQUksYUFBYSxhQUFhO0FBQzVCLG9CQUFNLGdCQUFnQixVQUFVO0FBQ2hDLHlCQUFXQSxjQUFhLGNBQWMsaUJBQWlCLEdBQUc7QUFDeEQsc0JBQU0sYUFBYSxjQUFjLG9CQUFvQkEsVUFBUyxFQUFFO0FBQ2hFLHNCQUFNLFNBQWdELENBQUM7QUFDdkQseUJBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDMUMsd0JBQU0sUUFBUSxXQUFXLENBQUM7QUFDMUIsd0JBQU0sU0FBUyxjQUFjLG9CQUFvQkEsVUFBUyxFQUFFLE9BQU8sQ0FBQztBQUNwRSx3QkFBTSxlQUFvRDtBQUFBLG9CQUN4RDtBQUFBLG9CQUNBLE9BQU8sU0FBUyxNQUFNLFNBQVM7QUFBQSxrQkFDakM7QUFDQSx5QkFBTyxLQUFLLFlBQVk7QUFBQSxnQkFDMUI7QUFDQSxzQkFBTSxXQUE0QztBQUFBLGtCQUNoRCxNQUFNQTtBQUFBLGtCQUNOO0FBQUEsZ0JBQ0Y7QUFDQSwwQkFBVSxLQUFLLFFBQVE7QUFBQSxjQUN6QjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsY0FBVSxZQUFZO0FBQUEsRUFDeEI7QUFDRjsiLAogICJuYW1lcyI6IFsidHJhY2tOYW1lIl0KfQo=
